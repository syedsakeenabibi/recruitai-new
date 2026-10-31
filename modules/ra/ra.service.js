const { randomUUID } = require("node:crypto");
const { createRaRepository } = require("./ra.repository");
const { manualUrlSource } = require("./sources/manualUrlSource");
const { SOURCE_ACCESS, discoverAtsJobs, searchFromUrl, verifyAtsJob } = require("./sources/atsSources");
const { findPublishedHiringChannels } = require("./contactDiscovery");
const { discoverEmployerContacts, discoverApifyDecisionMakers, verifyEmployerContacts } = require("./contactProviders");
const { lookupApolloCompany } = require("./apolloCompanyProvider");
const { ValidationError } = require("./ra.validation");

function createRaService(db) {
  const repository = createRaRepository(db);

  return {
    listSources() {
      return SOURCE_ACCESS;
    },

    async listOpportunities(campaignId) {
      return repository.listOpportunities(campaignId || null);
    },

    async listEmployerContacts(opportunityId) {
      const opportunity = await repository.getOpportunity(opportunityId);
      if (!opportunity) {
        const error = new Error("Saved opportunity not found.");
        error.statusCode = 404;
        throw error;
      }
      return repository.listEmployerContacts(opportunityId);
    },

    async getOpportunity(id) {
      return repository.getOpportunity(id);
    },

    async findHiringContacts(opportunityId) {
      const opportunity = await repository.getOpportunity(opportunityId);
      if (!opportunity) {
        const error = new Error("Saved opportunity not found.");
        error.statusCode = 404;
        throw error;
      }

      const rawData = typeof opportunity.rawData === "string"
        ? JSON.parse(opportunity.rawData || "{}")
        : opportunity.rawData || {};

      const provider = String(rawData.sourceProvider || "").toUpperCase();
      const board = rawData.sourceBoard;
      const externalId = rawData.sourceProviderJobId || opportunity.externalId;
      const checkedAt = new Date().toISOString();

      const supportedAts = ["GREENHOUSE", "LEVER", "ASHBY", "SMARTRECRUITERS"].includes(provider);
      let verified = null;
      let channels = [];
      let verificationMessage = "";

      if (supportedAts && board && externalId) {
        try {
          verified = await verifyAtsJob({ provider, board, externalId });

          if (verified.sourceUrl !== opportunity.sourceUrl) {
            const error = new Error("The live ATS posting no longer matches the saved vacancy URL.");
            error.statusCode = 409;
            throw error;
          }

          channels = findPublishedHiringChannels(
            verified.description,
            verified.sourceUrl,
            provider,
            checkedAt
          );
        } catch (sourceError) {
          if (sourceError.statusCode === 409) throw sourceError;
          verificationMessage = `Live ATS verification unavailable: ${sourceError.message}`;
        }
      }

      const companyName = verified?.companyName || opportunity.companyName;

      let companyWebsite =
        verified?.companyWebsite ||
        opportunity.companyWebsite ||
        rawData.companyWebsite ||
        null;

      // Enrich the company before starting contact discovery.
      let apolloCompany = null;

      if (companyName && !companyWebsite) {
        apolloCompany = await lookupApolloCompany(companyName).catch(() => null);
        companyWebsite = apolloCompany?.website || null;
      }

      let companyDomain = apolloCompany?.domain || null;

      if (companyWebsite) {
        try {
          companyDomain = new URL(
            /^https?:\/\//i.test(companyWebsite)
              ? companyWebsite
              : `https://${companyWebsite}`
          ).hostname.replace(/^www\./, "");
        } catch {
          companyDomain = null;
        }
      }

      const shouldRunApify =
        process.env.APIFY_CONTACT_DISCOVERY_ENABLED === "true" &&
        Boolean(companyWebsite);

      const providerResults = await Promise.allSettled([
        discoverEmployerContacts({
          companyName,
          jobTitle: opportunity.jobTitle,
          location: opportunity.location,
          companyDomain
        }),
        shouldRunApify
          ? discoverApifyDecisionMakers({
              companyWebsite,
              maxLeads: 5
            })
          : Promise.resolve([])
      ]);

      const hunterContacts = providerResults[0].status === "fulfilled"
        ? providerResults[0].value
        : [];

      const apifyContacts = providerResults[1].status === "fulfilled"
        ? providerResults[1].value
        : [];

      const contacts = [...hunterContacts, ...apifyContacts];

      const uniqueContacts = [
        ...new Map(
          contacts
            .filter(contact => contact && contact.email)
            .map(contact => [
              String(contact.email).trim().toLowerCase(),
              contact
            ])
        ).values()
      ];

      // Verify discovered Hunter and Apify business emails before saving.
      const verifiedContacts = await verifyEmployerContacts(uniqueContacts);

      const verificationSummary = verifiedContacts.reduce((summary, contact) => {
        const status = String(contact.verificationStatus || "UNVERIFIED").toUpperCase();
        const source = String(contact.sourceProvider || "UNKNOWN").toUpperCase();

        summary.total += 1;
        summary.byStatus[status] = (summary.byStatus[status] || 0) + 1;
        summary.bySource[source] = (summary.bySource[source] || 0) + 1;

        return summary;
      }, {
        total: 0,
        byStatus: {},
        bySource: {}
      });

      console.info("[RA] Employer email verification summary:", {
        opportunityId,
        ...verificationSummary
      });

      const evidenceUrl = verified?.sourceUrl || opportunity.sourceUrl || companyWebsite;

      await repository.upsertEmployerContacts(
        opportunityId,
        companyName,
        verifiedContacts,
        evidenceUrl
      );

      const savedContacts = await repository.listEmployerContacts(opportunityId);

      const hunterStatus = !process.env.HUNTER_API_KEY
        ? "NOT_CONFIGURED"
        : providerResults[0].status === "fulfilled" ? "COMPLETED" : "FAILED";

      const apifyStatus = !shouldRunApify
        ? (process.env.APIFY_CONTACT_DISCOVERY_ENABLED === "true"
            ? "NO_COMPANY_WEBSITE"
            : "DISABLED")
        : !process.env.APIFY_TOKEN
          ? "NOT_CONFIGURED"
          : providerResults[1].status === "fulfilled" ? "COMPLETED" : "FAILED";

      return {
        opportunityId,
        employer: companyName,
        companyWebsite,
        companyDomain,

        lookupStatus: savedContacts.length
          ? "CONTACTS_FOUND"
          : channels.length
            ? "VERIFIED_RECRUITMENT_CHANNEL"
            : "NOT_FOUND",

        sourceStatus: supportedAts
          ? (verified ? "CONNECTED" : "UNAVAILABLE")
          : "NO_SUPPORTED_LIVE_SOURCE",

        sourceProvider: provider || "MANUAL_OR_OTHER_SOURCE",
        evidenceUrl,
        contacts: savedContacts,
        channels,
        apolloCompany,
        checkedAt,

        providerStatus: {
          hunter: hunterStatus,
          hunterContactsFound: hunterContacts.length,
          apify: apifyStatus,
          apifyContactsFound: apifyContacts.length,
          totalUniqueContactsFound: uniqueContacts.length,
          totalContactsSaved: savedContacts.length
        },

        message: [
          `Hunter: ${hunterStatus} (${hunterContacts.length} contacts).`,
          `Apify: ${apifyStatus} (${apifyContacts.length} contacts).`,
          ...(savedContacts.length ? [] : ["No verified hiring contact found."]),
          `Saved ${savedContacts.length} contact(s).`,
          verified
            ? "The ATS vacancy was verified."
            : "ATS verification was not completed.",
          verificationMessage
        ].filter(Boolean).join(" ")
      };
    },    async getCampaign(id) {
      return repository.getCampaign(id);
    },

    async discoverOpportunities(createDiscoveryRequest) {
      const request = createDiscoveryRequest || {};
      const campaignId = request.campaignId || null;
      let effectiveTargeting = {
        country: request.country ?? null,
        roles: request.roles ?? [],
        industries: request.industries ?? [],
        locations: request.locations ?? [],
        keywords: request.keywords ?? [],
        employmentTypes: request.employmentTypes ?? [],
        experienceMin: request.experienceMin ?? null,
        experienceMax: request.experienceMax ?? null,
      };

      if (campaignId) {
        const campaign = await repository.getCampaign(campaignId);
        if (!campaign) {
          const error = new Error("Campaign not found.");
          error.statusCode = 404;
          throw error;
        }
        effectiveTargeting = {
          country: campaign.country,
          roles: campaign.roles || [],
          industries: campaign.industries || [],
          locations: campaign.locations || [],
          keywords: campaign.keywords || [],
          employmentTypes: campaign.employmentTypes || [],
          experienceMin: campaign.experienceMin ?? null,
          experienceMax: campaign.experienceMax ?? null,
        };
      }

      return {
        sourceStatus: "NOT_CONFIGURED",
        opportunities: [],
        campaignId,
        effectiveTargeting,
      };
    },

    async discoverLiveOpportunities(input) {
      const request = { ...input };

      if (request.campaignId) {
        const campaign = await repository.getCampaign(request.campaignId);

        if (!campaign) {
          const error = new Error("Campaign not found.");
          error.statusCode = 404;
          throw error;
        }

        request.country = campaign.country;
        request.roles = campaign.roles || [];
        request.industries = campaign.industries || [];
        request.locations = campaign.locations || [];
        request.employmentTypes = campaign.employmentTypes || [];
        request.experienceMin = campaign.experienceMin ?? null;
        request.experienceMax = campaign.experienceMax ?? null;

        request.keywords = [
          ...new Map(
            [...(campaign.keywords || []), ...(request.keywords || [])]
              .filter((keyword) => typeof keyword === "string" && keyword.trim())
              .map((keyword) => [keyword.trim().toLowerCase(), keyword.trim()])
          ).values()
        ];
      }

      const result = await discoverAtsJobs(request);

      const savedSummary = {
        discovered: result.opportunities.length,
        newlySaved: 0,
        alreadySaved: 0,
        failed: 0
      };

      const keywords = [
        ...new Set(
          (request.keywords || [])
            .filter((value) => typeof value === "string")
            .map((value) => value.trim())
            .filter(Boolean)
        )
      ];

      const sources = [
        ...new Set(
          (request.sources || (request.source ? [request.source] : []))
            .filter((value) => typeof value === "string")
            .map((value) => value.trim())
            .filter(Boolean)
        )
      ];

      // Create the search before processing individual vacancies.
      // This preserves the search even when some vacancy saves fail.
      const savedSearch = await repository.createSavedSearch({
        id: randomUUID(),
        name: String(
          request.name ||
          keywords.join(", ") ||
          request.title ||
          "RA live discovery"
        ).trim().slice(0, 200),
        keywords,
        sources,
        filters: {
          country: request.country ?? null,
          roles: request.roles || [],
          industries: request.industries || [],
          locations: request.locations || [],
          employmentTypes: request.employmentTypes || [],
          experienceMin: request.experienceMin ?? null,
          experienceMax: request.experienceMax ?? null,
          category: request.category ?? null,
          title: request.title ?? null,
          company: request.company ?? null,
          location: request.location ?? null,
          source: request.source ?? null,
          after: request.after ?? null,
          before: request.before ?? null,
          campaignId: request.campaignId || null,
          pages: request.pages ?? null
        },
        discoveredCount: savedSummary.discovered
      });

      for (const job of result.opportunities) {
        try {
          if (
            !job.sourceProvider ||
            !job.externalId ||
            !job.sourceUrl ||
            !job.jobTitle ||
            !["US", "UK"].includes(String(job.country || "").toUpperCase())
          ) {
            savedSummary.failed += 1;
            continue;
          }

          const duplicate = await repository.findLiveDuplicate({
            sourceUrl: job.sourceUrl,
            sourceProvider: job.sourceProvider,
            externalId: job.externalId
          });

          let opportunityId;

          if (duplicate) {
            opportunityId = duplicate.id;
          } else {
            const opportunity = await repository.createOpportunity({
              id: randomUUID(),
              campaignId: request.campaignId || null,
              source: "MANUAL_URL",
              externalId: String(job.externalId).slice(0, 200),
              sourceUrl: job.sourceUrl,
              companyName: job.companyName || null,
              companyWebsite: job.companyWebsite || null,
              jobTitle: job.jobTitle,
              country: String(job.country).toUpperCase(),
              location: job.location || null,
              description: job.description || null,
              skills: Array.isArray(job.skills) ? job.skills : [],
              employmentType: job.employmentType || null,
              postedAt: job.postedAt || null,
              discoveredAt: new Date().toISOString(),
              status: "NEW",
              rawData: {
                ...(job.rawData || {}),
                sourceProvider: job.sourceProvider,
                sourceBoard: job.sourceBoard || null,
                sourceProviderJobId: String(job.externalId),
                sourceAccess: job.sourceAccess || "LIVE API",
                ingestionMethod: "AUTOMATIC_LIVE_DISCOVERY",
                category: job.category || null,
                salary: job.salary ?? null,
                salaryText: job.salaryText || null,
                salaryCurrency: job.salaryCurrency || null,
                salaryPeriod: job.salaryPeriod || null,
                industry: job.industry || null,
                lastVerifiedAt: job.lastVerifiedAt || null,
                exportPermission: "NOT_VERIFIED"
              }
            });

            opportunityId = opportunity.id;
            savedSummary.newlySaved += 1;
          }

          // Link duplicates as well as newly inserted vacancies.
          await repository.linkSavedSearchOpportunity(
            savedSearch.id,
            opportunityId
          );

          if (duplicate) {
            savedSummary.alreadySaved += 1;
          }
        } catch (error) {
          savedSummary.failed += 1;
          console.error(
            "[RA] Saved-search vacancy processing failed:",
            error.message
          );
        }
      }

      await repository.updateSavedSearchCounts(
        savedSearch.id,
        savedSummary
      );

      return {
        sourceStatus: result.sourceStatus.some(
          (source) => source.status === "CONNECTED"
        )
          ? "LIVE_API"
          : "UNAVAILABLE",
        providerStatus: result.sourceStatus,
        opportunities: result.opportunities,
        savedSummary,
        savedSearchId: savedSearch.id,
        savedSearchName: savedSearch.name,
        campaignId: request.campaignId || null,
        effectiveTargeting: {
          country: request.country,
          roles: request.roles || [],
          industries: request.industries || [],
          locations: request.locations || [],
          employmentTypes: request.employmentTypes || [],
          experienceMin: request.experienceMin ?? null,
          experienceMax: request.experienceMax ?? null,
          category: request.category,
          title: request.title,
          keywords: request.keywords || [],
          company: request.company,
          location: request.location,
          source: request.source,
          after: request.after,
          before: request.before
        }
      };
    },

    async searchUrl(input) {
      const result = await searchFromUrl(input);
      return {
        ...result,
        campaignId: input.campaignId || null,
      };
    },

    async saveLiveOpportunity(input) {
      const verified = await verifyAtsJob(input);
      const campaignId = input.campaignId || null;
      if (campaignId) {
        const campaign = await repository.getCampaign(campaignId);
        if (!campaign) {
          const error = new Error("Campaign not found.");
          error.statusCode = 404;
          throw error;
        }
        if (campaign.country !== verified.country) {
          throw new ValidationError("The verified vacancy country does not match the selected campaign.");
        }
      }

      const duplicate = await repository.findLiveDuplicate({
        sourceUrl: verified.sourceUrl,
        sourceProvider: verified.sourceProvider,
        externalId: verified.externalId,
      });
      if (duplicate) {
        return {
          success: true,
          duplicate: true,
          opportunity: duplicate,
          message: "This verified vacancy is already saved.",
        };
      }

      const created = await repository.createOpportunity({
        id: randomUUID(),
        campaignId,
        source: "MANUAL_URL",
        externalId: verified.externalId,
        sourceUrl: verified.sourceUrl,
        companyName: verified.companyName,
        companyWebsite: verified.companyWebsite,
        jobTitle: verified.jobTitle,
        country: verified.country,
        location: verified.location,
        description: verified.description,
        skills: verified.skills,
        employmentType: verified.employmentType,
        postedAt: verified.postedAt,
        discoveredAt: verified.discoveredAt,
        status: "NEW",
        rawData: {
          ...verified.rawData,
          sourceProvider: verified.sourceProvider,
          sourceBoard: verified.sourceBoard,
          sourceProviderJobId: verified.externalId,
          sourceAccess: "LIVE API",
          ingestionMethod: "PUBLIC_ATS_API",
          category: verified.category,
          salary: verified.salary,
          salaryText: verified.salaryText,
          city: verified.city,
          lastVerifiedAt: verified.lastVerifiedAt,
        },
      });
      return { success: true, duplicate: false, opportunity: created };
    },

    async importManualUrl(input, options = {}) {
      const campaignId = options.campaignId || input.campaignId || null;
      let campaign = null;

      if (campaignId) {
        campaign = await repository.getCampaign(campaignId);
        if (!campaign) {
          const error = new Error("Campaign not found.");
          error.statusCode = 404;
          throw error;
        }
      }

      const country = input.country || campaign?.country || null;
      if (!country) {
        throw new ValidationError("country is required when no campaign country is available.");
      }

      const normalized = manualUrlSource.normalize({ ...input, country });

      const duplicate = await repository.findDuplicateOpportunity({
        source: normalized.source,
        externalId: normalized.externalId,
        sourceUrl: normalized.sourceUrl,
        companyName: normalized.companyName,
        jobTitle: normalized.jobTitle,
        location: normalized.location,
      });

      if (duplicate) {
        return {
          success: true,
          duplicate: true,
          opportunity: duplicate,
          sourceStatus: normalized.source,
          message: "An equivalent opportunity already exists.",
        };
      }

      const created = await repository.createOpportunity({
        id: randomUUID(),
        campaignId,
        source: normalized.source,
        externalId: normalized.externalId,
        sourceUrl: normalized.sourceUrl,
        companyName: normalized.companyName,
        companyWebsite: normalized.companyWebsite,
        jobTitle: normalized.jobTitle,
        country: normalized.country,
        location: normalized.location,
        description: normalized.description,
        skills: normalized.skills,
        employmentType: normalized.employmentType,
        postedAt: normalized.postedAt,
        discoveredAt: normalized.discoveredAt,
        status: normalized.status,
        rawData: normalized.rawData,
      });

      return {
        success: true,
        duplicate: false,
        opportunity: created,
        sourceStatus: normalized.source,
      };
    },
  };
}

module.exports = { createRaService };







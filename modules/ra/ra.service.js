const { randomUUID } = require("node:crypto");
const { createRaRepository } = require("./ra.repository");
const { manualUrlSource } = require("./sources/manualUrlSource");
const { SOURCE_ACCESS, discoverAtsJobs, searchFromUrl, verifyAtsJob } = require("./sources/atsSources");
const { findPublishedHiringChannels } = require("./contactDiscovery");
const { discoverEmployerContacts } = require("./contactProviders");
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

      if (!["GREENHOUSE", "LEVER", "ASHBY", "SMARTRECRUITERS"].includes(provider) || !board || !externalId) {
        return {
          opportunityId,
          employer: opportunity.companyName,
          lookupStatus: "NOT_FOUND",
          sourceStatus: "NO_SUPPORTED_LIVE_SOURCE",
          contacts: [],
          channels: [],
          checkedAt,
          message: "No verified hiring contact found. This saved opportunity has no supported live ATS source to verify.",
        };
      }

      let verified;
      try {
        verified = await verifyAtsJob({ provider, board, externalId });
      } catch (sourceError) {
        const error = new Error(sourceError.message || "The original ATS vacancy could not be verified.");
        error.code = sourceError.code;
        error.statusCode = sourceError.code === "AUTHORIZATION_REQUIRED"
          ? 424
          : sourceError.statusCode === 429 ? 429
            : sourceError.statusCode === 404 ? 404
              : 502;
        throw error;
      }

      if (verified.sourceUrl !== opportunity.sourceUrl) {
        const error = new Error("The live ATS posting no longer matches the saved vacancy URL.");
        error.statusCode = 409;
        throw error;
      }

      const channels = findPublishedHiringChannels(
        verified.description,
        verified.sourceUrl,
        provider,
        checkedAt
      );

   const contacts = await discoverEmployerContacts({
  companyName: verified.companyName,
  jobTitle: opportunity.jobTitle,
  location: opportunity.location,
  companyDomain: verified.companyWebsite
    ? new URL(verified.companyWebsite).hostname.replace(/^www\./, "")
    : null,
});

      const apolloCompany = await lookupApolloCompany(verified.companyName);

      return {
        opportunityId,
        employer: verified.companyName,
        lookupStatus: contacts.length ? "CONTACTS_FOUND" : channels.length ? "VERIFIED_RECRUITMENT_CHANNEL" : "NOT_FOUND",
        sourceStatus: "CONNECTED",
        sourceProvider: provider,
        evidenceUrl: verified.sourceUrl,
        contacts,
        channels,
        apolloCompany,
        checkedAt,
        message: channels.length
          ? "Found an employer recruitment channel explicitly published in the live vacancy."
          : "No verified hiring contact found in the live employer vacancy. No person or contact details were inferred.",
      };
    },

    async getCampaign(id) {
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
          ).values(),
        ];
      }

      const result = await discoverAtsJobs(request);

      return {
        sourceStatus: result.sourceStatus.some((source) => source.status === "CONNECTED") ? "LIVE_API" : "UNAVAILABLE",
        providerStatus: result.sourceStatus,
        opportunities: result.opportunities,
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
          keywords: request.keywords,
          company: request.company,
          location: request.location,
          source: request.source,
          after: request.after,
          before: request.before,
        },
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


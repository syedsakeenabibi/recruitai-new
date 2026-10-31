const { normalizeUrl, normalizeMatchText } = require("./sources/sourceAdapter");
const { randomUUID } = require("node:crypto");

function createRaRepository(db) {
  return {
    async getCampaign(id) {
      const result = await db.query(
        `SELECT * FROM "BDMCampaign" WHERE "id" = $1 LIMIT 1`,
        [id]
      );
      return result.rows[0] || null;
    },

    async getOpportunity(id) {
      const result = await db.query(
        `SELECT * FROM "JobOpportunity" WHERE "id" = $1 LIMIT 1`,
        [id]
      );
      return result.rows[0] || null;
    },

    async listOpportunities(campaignId) {
      const result = campaignId
        ? await db.query(
            `SELECT * FROM "JobOpportunity" WHERE "campaignId" = $1 ORDER BY "discoveredAt" DESC, "jobTitle" ASC`,
            [campaignId]
          )
        : await db.query(
            `SELECT * FROM "JobOpportunity" ORDER BY "discoveredAt" DESC, "jobTitle" ASC`
          );
      return result.rows;
    },

    async findDuplicateOpportunity(data) {
      if (data.source && data.externalId) {
        const result = await db.query(
          `SELECT * FROM "JobOpportunity"
           WHERE "source" = $1 AND "externalId" = $2
           LIMIT 1`,
          [data.source, data.externalId]
        );
        if (result.rows[0]) return result.rows[0];
      }

      const normalizedUrl = normalizeUrl(data.sourceUrl);
      if (normalizedUrl) {
        const result = await db.query(
          `SELECT * FROM "JobOpportunity"
           WHERE LOWER(REGEXP_REPLACE(BTRIM(SPLIT_PART("sourceUrl", '#', 1)), '/+([?]|$)', '\\1', 'g')) = LOWER($1)
           LIMIT 1`,
          [normalizedUrl.replace(/\/+$/, "")]
        );
        if (result.rows[0]) return result.rows[0];
      }

      if (data.companyName && data.jobTitle) {
        const result = await db.query(
          `SELECT * FROM "JobOpportunity"
           WHERE LOWER(REGEXP_REPLACE(BTRIM(COALESCE("companyName", '')), '[[:space:]]+', ' ', 'g')) = $1
             AND LOWER(REGEXP_REPLACE(BTRIM(COALESCE("jobTitle", '')), '[[:space:]]+', ' ', 'g')) = $2
             AND LOWER(REGEXP_REPLACE(BTRIM(COALESCE("location", '')), '[[:space:]]+', ' ', 'g')) = $3
           LIMIT 1`,
          [
            normalizeMatchText(data.companyName),
            normalizeMatchText(data.jobTitle),
            normalizeMatchText(data.location),
          ]
        );
        if (result.rows[0]) return result.rows[0];
      }

      return null;
    },

    async findLiveDuplicate(data) {
      const url = normalizeUrl(data.sourceUrl);
      if (url) {
        const byUrl = await db.query(
          `SELECT * FROM "JobOpportunity"
           WHERE LOWER(REGEXP_REPLACE(BTRIM(SPLIT_PART("sourceUrl", '#', 1)), '/+([?]|$)', '\\1', 'g')) = LOWER($1)
           LIMIT 1`,
          [url.replace(/\/+$/, "")]
        );
        if (byUrl.rows[0]) return byUrl.rows[0];
      }
      const byProviderId = await db.query(
        `SELECT * FROM "JobOpportunity"
         WHERE "rawData"->>'sourceProvider' = $1
           AND "rawData"->>'sourceProviderJobId' = $2
         LIMIT 1`,
        [data.sourceProvider, data.externalId]
      );
      return byProviderId.rows[0] || null;
    },

    async upsertEmployerContacts(opportunityId, companyName, contacts, sourceUrl) {
      const saved = [];
      const seen = new Set();

      for (const contact of contacts || []) {
        const email = String(contact.email || "").trim().toLowerCase() || null;
        const profileUrl = String(contact.professionalProfileUrl || "").trim() || null;
        const phone = String(contact.phone || "").trim() || null;
        const contactName = String(contact.contactName || "").trim() || null;
        const contactTitle = String(contact.contactTitle || "").trim() || null;

        if (!email && !profileUrl && !phone && !contactName) continue;

        const identity = email
          ? `email:${email}`
          : profileUrl
            ? `profile:${profileUrl.toLowerCase().replace(/\/+$/, "")}`
            : phone
              ? `phone:${phone.replace(/\D/g, "")}`
              : `name:${contactName.toLowerCase()}|title:${(contactTitle || "").toLowerCase()}`;

        if (seen.has(identity)) continue;
        seen.add(identity);

        const values = [
          opportunityId,
          email,
          profileUrl,
          phone,
          contactName,
          contactTitle
        ];

        const existing = await db.query(
          `SELECT * FROM "EmployerContact"
           WHERE "opportunityId" = $1
             AND (
               ($2::varchar IS NOT NULL AND LOWER("email") = $2)
               OR ($3::text IS NOT NULL AND LOWER("professionalProfileUrl") = LOWER($3))
               OR ($4::varchar IS NOT NULL AND regexp_replace(COALESCE("phone", ''), '[^0-9]', '', 'g') = regexp_replace($4, '[^0-9]', '', 'g'))
               OR (
                 $5::varchar IS NOT NULL
                 AND LOWER(COALESCE("contactName", '')) = LOWER($5)
                 AND LOWER(COALESCE("contactTitle", '')) = LOWER(COALESCE($6, ''))
               )
             )
           ORDER BY "checkedAt" DESC
           LIMIT 1`,
          values
        );

        if (existing.rows[0]) {
          const result = await db.query(
            `UPDATE "EmployerContact"
             SET
               "companyName" = COALESCE($2, "companyName"),
               "contactName" = COALESCE($3, "contactName"),
               "contactTitle" = COALESCE($4, "contactTitle"),
               "email" = COALESCE($5, "email"),
               "phone" = COALESCE($6, "phone"),
               "professionalProfileUrl" = COALESCE($7, "professionalProfileUrl"),
               "sourceProvider" = COALESCE($8, "sourceProvider"),
               "sourceUrl" = COALESCE($9, "sourceUrl"),
               "verificationStatus" = $10,
               "confidence" = $11,
               "emailVerification" = $12::jsonb,
               "checkedAt" = CURRENT_TIMESTAMP,
               "updatedAt" = CURRENT_TIMESTAMP
             WHERE "id" = $1
             RETURNING *`,
            [
              existing.rows[0].id,
              companyName || null,
              contactName,
              contactTitle,
              email,
              phone,
              profileUrl,
              contact.sourceProvider || null,
              sourceUrl || null,
              contact.verificationStatus || "UNVERIFIED",
              contact.emailVerification?.score != null && Number.isFinite(Number(contact.emailVerification.score)) ? Number(contact.emailVerification.score) : null,
              contact.emailVerification ? JSON.stringify(contact.emailVerification) : null
            ]
          );

          if (result.rows[0]) saved.push(result.rows[0]);
          continue;
        }

        const result = await db.query(
          `INSERT INTO "EmployerContact" (
            "id", "opportunityId", "companyName", "contactName",
            "contactTitle", "email", "phone", "professionalProfileUrl",
            "contactType", "sourceProvider", "sourceUrl",
            "verificationStatus", "confidence", "emailVerification", "checkedAt", "createdAt", "updatedAt"
          ) VALUES (
            $1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14::jsonb,
            CURRENT_TIMESTAMP, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP
          )
          ON CONFLICT ("opportunityId", (LOWER("email")))
          WHERE "email" IS NOT NULL
          DO UPDATE SET
            "companyName" = COALESCE(EXCLUDED."companyName", "EmployerContact"."companyName"),
            "contactName" = COALESCE(EXCLUDED."contactName", "EmployerContact"."contactName"),
            "contactTitle" = COALESCE(EXCLUDED."contactTitle", "EmployerContact"."contactTitle"),
            "phone" = COALESCE(EXCLUDED."phone", "EmployerContact"."phone"),
            "professionalProfileUrl" = COALESCE(EXCLUDED."professionalProfileUrl", "EmployerContact"."professionalProfileUrl"),
            "sourceProvider" = EXCLUDED."sourceProvider",
            "sourceUrl" = COALESCE(EXCLUDED."sourceUrl", "EmployerContact"."sourceUrl"),
            "verificationStatus" = EXCLUDED."verificationStatus",
            "confidence" = EXCLUDED."confidence",
            "emailVerification" = EXCLUDED."emailVerification",
            "checkedAt" = CURRENT_TIMESTAMP,
            "updatedAt" = CURRENT_TIMESTAMP
          RETURNING *`,
          [
            randomUUID(),
            opportunityId,
            companyName || null,
            contactName,
            contactTitle,
            email,
            phone,
            profileUrl,
            contact.contactType || "EMPLOYER_CONTACT",
            contact.sourceProvider || null,
            sourceUrl || null,
            contact.verificationStatus || "UNVERIFIED",
            contact.emailVerification?.score != null && Number.isFinite(Number(contact.emailVerification.score)) ? Number(contact.emailVerification.score) : null,
            contact.emailVerification ? JSON.stringify(contact.emailVerification) : null
          ]
        );

        if (result.rows[0]) saved.push(result.rows[0]);
      }

      return saved;
    },
    async listEmployerContacts(opportunityId) {
      const result = await db.query(
        `SELECT * FROM "EmployerContact"
         WHERE "opportunityId" = $1
         ORDER BY "checkedAt" DESC`,
        [opportunityId]
      );
      return result.rows;
    },

    async createSavedSearch(data) {
      const result = await db.query(
        `INSERT INTO "RASavedSearch" (
          "id", "name", "keywords", "sources", "filters",
          "discoveredCount", "newlySavedCount",
          "alreadySavedCount", "failedCount", "createdBy"
        ) VALUES ($1,$2,$3,$4,$5::jsonb,$6,0,0,0,$7)
        RETURNING *`,
        [
          data.id || randomUUID(),
          data.name,
          data.keywords || [],
          data.sources || [],
          JSON.stringify(data.filters || {}),
          data.discoveredCount || 0,
          data.createdBy || null
        ]
      );
      return result.rows[0];
    },

    async linkSavedSearchOpportunity(savedSearchId, opportunityId) {
      const result = await db.query(
        `INSERT INTO "RASavedSearchOpportunity" (
          "id", "savedSearchId", "opportunityId"
        )
        VALUES ($1,$2,$3)
        ON CONFLICT ("savedSearchId", "opportunityId") DO NOTHING
        RETURNING * `,
        [randomUUID(), savedSearchId, opportunityId]
      );
      return result.rows[0] || null;
    },

    async updateSavedSearchCounts(savedSearchId, summary) {
      const result = await db.query(
        `UPDATE "RASavedSearch"
         SET
           "discoveredCount" = $2,
           "newlySavedCount" = $3,
           "alreadySavedCount" = $4,
           "failedCount" = $5,
           "updatedAt" = CURRENT_TIMESTAMP
         WHERE "id" = $1
         RETURNING * `,
        [
          savedSearchId,
          summary.discovered,
          summary.newlySaved,
          summary.alreadySaved,
          summary.failed
        ]
      );
      return result.rows[0] || null;
    },

    async createOpportunity(data) {
      const result = await db.query(
        `INSERT INTO "JobOpportunity" (
          "id", "campaignId", "source", "externalId", "sourceUrl",
          "companyName", "companyWebsite", "jobTitle", "country", "location",
          "description", "skills", "employmentType", "postedAt",
          "discoveredAt", "status", "rawData"
        ) VALUES (
          $1, $2, $3, $4, $5, $6, $7, $8, $9, $10,
          $11, $12, $13, $14, COALESCE($15::timestamptz, CURRENT_TIMESTAMP), $16, $17::jsonb
        ) RETURNING *`,
        [
          data.id,
          data.campaignId ?? null,
          data.source ?? "MANUAL_URL",
          data.externalId ?? null,
          data.sourceUrl ?? null,
          data.companyName ?? null,
          data.companyWebsite ?? null,
          data.jobTitle ?? null,
          data.country ?? null,
          data.location ?? null,
          data.description ?? null,
          data.skills ?? [],
          data.employmentType ?? null,
          data.postedAt ?? null,
          data.discoveredAt ?? null,
          data.status ?? "NEW",
          JSON.stringify(data.rawData ?? {}),
        ]
      );
      return result.rows[0];
    },
  };
}

module.exports = { createRaRepository };





const { normalizeUrl, normalizeMatchText } = require("./sources/sourceAdapter");

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

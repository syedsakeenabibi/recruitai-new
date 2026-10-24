const CAMPAIGN_PATCH_COLUMNS = {
  name: '"name"',
  country: '"country"',
  roles: '"roles"',
  industries: '"industries"',
  locations: '"locations"',
  keywords: '"keywords"',
  employmentTypes: '"employmentTypes"',
  experienceMin: '"experienceMin"',
  experienceMax: '"experienceMax"',
  priority: '"priority"',
  status: '"status"',
};

const OPPORTUNITY_PATCH_COLUMNS = {
  campaignId: '"campaignId"',
  source: '"source"',
  externalId: '"externalId"',
  sourceUrl: '"sourceUrl"',
  companyName: '"companyName"',
  companyWebsite: '"companyWebsite"',
  jobTitle: '"jobTitle"',
  country: '"country"',
  location: '"location"',
  description: '"description"',
  skills: '"skills"',
  employmentType: '"employmentType"',
  postedAt: '"postedAt"',
  discoveredAt: '"discoveredAt"',
  status: '"status"',
  rawData: '"rawData"',
};

function createBdmRepository(db) {
  return {
    async listCampaigns() {
      const result = await db.query(
        `SELECT * FROM "BDMCampaign" ORDER BY "updatedAt" DESC, "name" ASC`
      );
      return result.rows;
    },

    async getCampaign(id) {
      const result = await db.query(
        `SELECT * FROM "BDMCampaign" WHERE "id" = $1 LIMIT 1`,
        [id]
      );
      return result.rows[0] || null;
    },

    async createCampaign(id, data, createdBy) {
      const result = await db.query(
        `INSERT INTO "BDMCampaign" (
          "id", "name", "country", "roles", "industries", "locations",
          "keywords", "employmentTypes", "experienceMin", "experienceMax",
          "priority", "status", "createdBy"
        ) VALUES (
          $1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13
        ) RETURNING *`,
        [
          id,
          data.name,
          data.country,
          data.roles ?? [],
          data.industries ?? [],
          data.locations ?? [],
          data.keywords ?? [],
          data.employmentTypes ?? [],
          data.experienceMin ?? null,
          data.experienceMax ?? null,
          data.priority ?? 0,
          data.status ?? "DRAFT",
          createdBy,
        ]
      );
      return result.rows[0];
    },

    async updateCampaign(id, data) {
      return updateRow(db, "BDMCampaign", id, data, CAMPAIGN_PATCH_COLUMNS);
    },

    async deleteCampaign(id) {
      const result = await db.query(
        `DELETE FROM "BDMCampaign" WHERE "id" = $1`,
        [id]
      );
      return result.rowCount > 0;
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

    async getOpportunity(id) {
      const result = await db.query(
        `SELECT * FROM "JobOpportunity" WHERE "id" = $1 LIMIT 1`,
        [id]
      );
      return result.rows[0] || null;
    },

    async createOpportunity(id, data) {
      const result = await db.query(
        `INSERT INTO "JobOpportunity" (
          "id", "campaignId", "source", "externalId", "sourceUrl",
          "companyName", "companyWebsite", "jobTitle", "country", "location",
          "description", "skills", "employmentType", "postedAt",
          "discoveredAt", "status", "rawData"
        ) VALUES (
          $1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14,
          COALESCE($15::timestamptz, CURRENT_TIMESTAMP), $16, $17::jsonb
        ) RETURNING *`,
        [
          id,
          data.campaignId ?? null,
          data.source ?? "MANUAL",
          data.externalId ?? null,
          data.sourceUrl ?? null,
          data.companyName ?? null,
          data.companyWebsite ?? null,
          data.jobTitle,
          data.country,
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

    async updateOpportunity(id, data) {
      return updateRow(db, "JobOpportunity", id, data, OPPORTUNITY_PATCH_COLUMNS, {
        jsonFields: ["rawData"],
      });
    },

    async deleteOpportunity(id) {
      const result = await db.query(
        `DELETE FROM "JobOpportunity" WHERE "id" = $1`,
        [id]
      );
      return result.rowCount > 0;
    },
  };
}

async function updateRow(db, table, id, data, columns, { jsonFields = [] } = {}) {
  const entries = Object.entries(data);
  const assignments = entries.map(([key], index) => {
    const column = columns[key];
    if (!column) throw new Error(`Unsupported update field: ${key}.`);
    return `${column} = $${index + 1}${jsonFields.includes(key) ? "::jsonb" : ""}`;
  });
  assignments.push('"updatedAt" = CURRENT_TIMESTAMP');
  const values = entries.map(([key, value]) =>
    jsonFields.includes(key) ? JSON.stringify(value) : value
  );
  values.push(id);
  const result = await db.query(
    `UPDATE "${table}" SET ${assignments.join(", ")} WHERE "id" = $${values.length} RETURNING *`,
    values
  );
  return result.rows[0] || null;
}

module.exports = { createBdmRepository };

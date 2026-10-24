const { randomUUID } = require("node:crypto");
const { createBdmRepository } = require("./bdm.repository");
const { ValidationError } = require("./bdm.validation");

function createBdmService(db) {
  const repository = createBdmRepository(db);

  return {
    listCampaigns: () => repository.listCampaigns(),
    getCampaign: (id) => repository.getCampaign(id),

    async createCampaign(data, createdBy) {
      if (typeof createdBy !== "string" || !createdBy.trim()) {
        const error = new Error("Authenticated administrator ID is required.");
        error.statusCode = 401;
        throw error;
      }
      return repository.createCampaign(randomUUID(), data, createdBy);
    },

    async updateCampaign(id, data) {
      const current = await repository.getCampaign(id);
      if (!current) return null;
      const merged = { ...current, ...data };
      if (
        merged.experienceMin !== null &&
        merged.experienceMin !== undefined &&
        merged.experienceMax !== null &&
        merged.experienceMax !== undefined &&
        merged.experienceMin > merged.experienceMax
      ) {
        throw new ValidationError("experienceMin cannot be greater than experienceMax.");
      }
      return repository.updateCampaign(id, data);
    },

    deleteCampaign: (id) => repository.deleteCampaign(id),
    listOpportunities: (campaignId) => repository.listOpportunities(campaignId),
    getOpportunity: (id) => repository.getOpportunity(id),
    createOpportunity: (data) => repository.createOpportunity(randomUUID(), data),
    updateOpportunity: (id, data) => repository.updateOpportunity(id, data),
    deleteOpportunity: (id) => repository.deleteOpportunity(id),
  };
}

module.exports = { createBdmService };

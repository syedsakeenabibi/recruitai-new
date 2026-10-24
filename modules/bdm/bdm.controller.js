const { createBdmService } = require("./bdm.service");
const {
  validateCampaignCreate,
  validateCampaignPatch,
  validateOpportunityCreate,
  validateOpportunityPatch,
  validateCampaignId,
} = require("./bdm.validation");

function createBdmController({ getDb }) {
  if (typeof getDb !== "function") {
    throw new TypeError("createBdmController requires a getDb function.");
  }

  function handle(operation) {
    return async (req, res, next) => {
      let db;
      let failure;
      try {
        db = await getDb();
        await operation(req, res, createBdmService(db));
      } catch (error) {
        failure = error;
      }

      if (db) {
        try {
          await db.end();
        } catch (closeError) {
          if (failure) failure.cleanupError = closeError;
          else failure = closeError;
        }
      }

      if (failure) next(failure);
    };
  }

  return {
    listCampaigns: handle(async (_req, res, service) => {
      res.json({ campaigns: await service.listCampaigns() });
    }),
    getCampaign: handle(async (req, res, service) => {
      const campaign = await service.getCampaign(req.params.id);
      if (!campaign) return notFound("Campaign");
      res.json({ campaign });
    }),
    createCampaign: handle(async (req, res, service) => {
      const data = validateCampaignCreate(req.body);
      const campaign = await service.createCampaign(data, req.admin?.id);
      res.status(201).json({ campaign });
    }),
    updateCampaign: handle(async (req, res, service) => {
      const data = validateCampaignPatch(req.body);
      const campaign = await service.updateCampaign(req.params.id, data);
      if (!campaign) return notFound("Campaign");
      res.json({ campaign });
    }),
    deleteCampaign: handle(async (req, res, service) => {
      if (!(await service.deleteCampaign(req.params.id))) return notFound("Campaign");
      res.status(204).end();
    }),
    listOpportunities: handle(async (req, res, service) => {
      const campaignId = req.query.campaignId
        ? validateCampaignId(req.query.campaignId)
        : null;
      res.json({ opportunities: await service.listOpportunities(campaignId) });
    }),
    getOpportunity: handle(async (req, res, service) => {
      const opportunity = await service.getOpportunity(req.params.id);
      if (!opportunity) return notFound("Opportunity");
      res.json({ opportunity });
    }),
    createOpportunity: handle(async (req, res, service) => {
      const data = validateOpportunityCreate(req.body);
      const opportunity = await service.createOpportunity(data);
      res.status(201).json({ opportunity });
    }),
    updateOpportunity: handle(async (req, res, service) => {
      const data = validateOpportunityPatch(req.body);
      const opportunity = await service.updateOpportunity(req.params.id, data);
      if (!opportunity) return notFound("Opportunity");
      res.json({ opportunity });
    }),
    deleteOpportunity: handle(async (req, res, service) => {
      if (!(await service.deleteOpportunity(req.params.id))) return notFound("Opportunity");
      res.status(204).end();
    }),
  };
}

function notFound(entity) {
  const error = new Error(`${entity} not found.`);
  error.statusCode = 404;
  throw error;
}

module.exports = { createBdmController };

const { createRaService } = require("./ra.service");
const {
  validateDiscoveryRequest,
  validateLiveDiscoveryRequest,
  validateSearchUrlRequest,
  validateSaveLiveOpportunity,
  validateFindHiringContactsRequest,
  validateManualUrlImport,
} = require("./ra.validation");

function createRaController({ getDb }) {
  if (typeof getDb !== "function") {
    throw new TypeError("createRaController requires a getDb function.");
  }

  function handle(operation) {
    return async (req, res, next) => {
      let db;
      let failure;
      try {
        db = await getDb();
        await operation(req, res, createRaService(db));
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
    listSources: handle(async (_req, res, service) => {
      res.json({ sources: service.listSources() });
    }),

    discover: handle(async (req, res, service) => {
      const payload = validateDiscoveryRequest(req.body || {});
      const result = await service.discoverOpportunities(payload);
      res.json(result);
    }),

    discoverLive: handle(async (req, res, service) => {
      const payload = validateLiveDiscoveryRequest(req.body || {});
      res.json(await service.discoverLiveOpportunities(payload));
    }),

    searchUrl: handle(async (req, res, service) => {
      const payload = validateSearchUrlRequest(req.body || {});
      res.json(await service.searchUrl(payload));
    }),

    saveLive: handle(async (req, res, service) => {
      const payload = validateSaveLiveOpportunity(req.body || {});
      const result = await service.saveLiveOpportunity(payload);
      res.status(result.duplicate ? 200 : 201).json(result);
    }),

    findHiringContacts: handle(async (req, res, service) => {
      const payload = validateFindHiringContactsRequest(req.body || {}, req.params.id);
      res.json(await service.findHiringContacts(payload.opportunityId));
    }),

    listOpportunities: handle(async (req, res, service) => {
      const campaignId = typeof req.query.campaignId === "string" && req.query.campaignId.trim()
        ? req.query.campaignId.trim()
        : null;
      const opportunities = await service.listOpportunities(campaignId);
      res.json({ opportunities });
    }),

    importManualUrl: handle(async (req, res, service) => {
      const payload = validateManualUrlImport(req.body || {});
      const result = await service.importManualUrl(payload, { campaignId: payload.campaignId });
      res.status(result.duplicate ? 200 : 201).json(result);
    }),
  };
}

module.exports = { createRaController };

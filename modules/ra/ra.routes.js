const express = require("express");
const { createRaController } = require("./ra.controller");

function createRaRouter({ getDb, requireAdmin, requireRole, logger = console } = {}) {
  if (typeof requireAdmin !== "function") {
    throw new TypeError("createRaRouter requires the existing requireAdmin middleware.");
  }

  const router = express.Router();
  const controller = createRaController({ getDb });
  const liveRequestTimes = new Map();

  router.use(requireAdmin);
  if (requireRole) router.use(requireRole);
  router.get("/sources", controller.listSources);
  router.post("/discover", controller.discover);
  const rateLimitLiveSource = (handler) => (req, res, next) => {
    const now = Date.now();
    const key = req.admin?.id || req.ip;
    const prior = (liveRequestTimes.get(key) || []).filter((timestamp) => now - timestamp < 60_000);
    if (prior.length >= 6) {
      return res.status(429).json({ success: false, error: "Live source rate limit reached; try again in one minute." });
    }
    prior.push(now);
    liveRequestTimes.set(key, prior);
    return handler(req, res, next);
  };
  router.post("/discover-live", rateLimitLiveSource(controller.discoverLive));
  router.post("/search-url", rateLimitLiveSource(controller.searchUrl));
  router.post("/save-live", controller.saveLive);
  router.post("/opportunities/:id/find-contacts", rateLimitLiveSource(controller.findHiringContacts));
  router.get("/opportunities", controller.listOpportunities);
  router.post("/import-url", controller.importManualUrl);

  router.use((error, _req, res, next) => {
    if (res.headersSent) return next(error);
    logger.error("RA request failed:", error);

    let status = Number.isInteger(error.statusCode) ? error.statusCode : 500;
    if (error.code === "23503" || error.code === "23505") status = 409;
    else if (error.code === "23514" || error.code === "22P02") status = 400;

    const message = status < 500 ? error.message : "Unable to process the RA request.";
    res.status(status).json({ success: false, error: message });
  });

  return router;
}

module.exports = { createRaRouter };

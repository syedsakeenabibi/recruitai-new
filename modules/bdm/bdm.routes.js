const express = require("express");
const { createBdmController } = require("./bdm.controller");

function createBdmRouter({ getDb, requireAdmin, requireRole, logger = console } = {}) {
  if (typeof requireAdmin !== "function") {
    throw new TypeError("createBdmRouter requires the existing requireAdmin middleware.");
  }

  const router = express.Router();
  const controller = createBdmController({ getDb });

  router.use(requireAdmin);
  if (requireRole) router.use(requireRole);
  router.get("/campaigns", controller.listCampaigns);
  router.get("/campaigns/:id", controller.getCampaign);
  router.post("/campaigns", controller.createCampaign);
  router.patch("/campaigns/:id", controller.updateCampaign);
  router.delete("/campaigns/:id", controller.deleteCampaign);

  router.get("/opportunities", controller.listOpportunities);
  router.get("/opportunities/:id", controller.getOpportunity);
  router.post("/opportunities", controller.createOpportunity);
  router.patch("/opportunities/:id", controller.updateOpportunity);
  router.delete("/opportunities/:id", controller.deleteOpportunity);

  router.use((error, _req, res, next) => {
    if (res.headersSent) return next(error);
    logger.error("BDM request failed:", error);
    if (error.cleanupError) logger.error("BDM database connection cleanup failed:", error.cleanupError);

    let status = Number.isInteger(error.statusCode) ? error.statusCode : 500;
    if (error.code === "23503" || error.code === "23505") status = 409;
    else if (error.code === "23514" || error.code === "22P02") status = 400;

    const message =
      status < 500 ? error.message : "Unable to process the BDM request.";
    res.status(status).json({ success: false, error: message });
  });

  return router;
}

module.exports = { createBdmRouter };

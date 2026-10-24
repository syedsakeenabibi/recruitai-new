const express = require("express");
const { createRecruitmentController } = require("./recruitment.controller");

function createRecruitmentRouter({ getDb, requireAdmin, requireRole, logger = console } = {}) {
  if (typeof requireAdmin !== "function") {
    throw new TypeError("createRecruitmentRouter requires the existing requireAdmin middleware.");
  }

  const router = express.Router();
  const controller = createRecruitmentController({ getDb });
  router.use(requireAdmin);

  const recruiterAccess = requireRole?.(["ADMIN", "RECRUITER"]);
  const leadAccess = requireRole?.(["ADMIN", "RECRUITER", "BDM", "RA"]);
  const secured = (middleware) => middleware ? [middleware] : [];

  router.get("/leads", ...secured(leadAccess), controller.listLeads);
  router.post("/leads", ...secured(leadAccess), controller.createLead);
  router.patch("/leads/:id", ...secured(leadAccess), controller.updateLead);

  router.get("/requirements", ...secured(recruiterAccess), controller.listRequirements);
  router.get("/requirements/:id", ...secured(recruiterAccess), controller.getRequirement);
  router.post("/requirements", ...secured(recruiterAccess), controller.createRequirement);
  router.patch("/requirements/:id", ...secured(recruiterAccess), controller.updateRequirement);
  router.get("/assigned-jobs", ...secured(recruiterAccess), controller.listAssignedJobs);
  router.get("/requirements/:id/matches", ...secured(recruiterAccess), controller.matchCandidates);

  router.get("/candidates", ...secured(recruiterAccess), controller.searchCandidates);
  router.get("/shortlists", ...secured(recruiterAccess), controller.listShortlists);
  router.post("/shortlists", ...secured(recruiterAccess), controller.createShortlist);
  router.patch("/shortlists/:id", ...secured(recruiterAccess), controller.updateShortlist);

  router.get("/submissions", ...secured(recruiterAccess), controller.listSubmissions);
  router.post("/submissions", ...secured(recruiterAccess), controller.createSubmission);
  router.patch("/submissions/:id", ...secured(recruiterAccess), controller.updateSubmission);

  router.get("/interviews", ...secured(recruiterAccess), controller.listInterviews);
  router.post("/interviews", ...secured(recruiterAccess), controller.createInterview);
  router.patch("/interviews/:id", ...secured(recruiterAccess), controller.updateInterview);

  router.get("/placements", ...secured(recruiterAccess), controller.listPlacements);
  router.post("/placements", ...secured(recruiterAccess), controller.createPlacement);
  router.patch("/placements/:id", ...secured(recruiterAccess), controller.updatePlacement);
  router.get("/reports", ...secured(recruiterAccess), controller.getReports);

  router.use((error, _req, res, next) => {
    if (res.headersSent) return next(error);
    logger.error("Recruitment request failed:", error);

    let status = Number.isInteger(error.statusCode) ? error.statusCode : 500;
    if (error.code === "23503" || error.code === "23505") status = 409;
    else if (error.code === "23514" || error.code === "22P02") status = 400;

    const message = status < 500 ? error.message : "Unable to process the recruitment request.";
    res.status(status).json({ success: false, error: message });
  });

  return router;
}

module.exports = { createRecruitmentRouter };

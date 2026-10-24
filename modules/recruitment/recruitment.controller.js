const { createRecruitmentService } = require("./recruitment.service");

function createRecruitmentController({ getDb }) {
  if (typeof getDb !== "function") {
    throw new TypeError("createRecruitmentController requires a getDb function.");
  }

  function handle(operation) {
    return async (req, res, next) => {
      let db;
      let failure;
      try {
        db = await getDb();
        await operation(req, res, createRecruitmentService(db));
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
    listLeads: handle(async (_req, res, service) => res.json({ leads: await service.listLeads() })),
    createLead: handle(async (req, res, service) => {
      const lead = await service.createLead(req.body || {}, req.admin?.id);
      res.status(201).json({ lead });
    }),
    updateLead: handle(async (req, res, service) => {
      const lead = await service.updateLead(req.params.id, req.body || {});
      if (!lead) return notFound("Company lead");
      res.json({ lead });
    }),

    listRequirements: handle(async (req, res, service) =>
      res.json({ requirements: await service.listRequirements(req.query.status) })
    ),
    getRequirement: handle(async (req, res, service) => {
      const requirement = await service.getRequirement(req.params.id);
      if (!requirement) return notFound("Requirement");
      res.json({ requirement });
    }),
    createRequirement: handle(async (req, res, service) => {
      const requirement = await service.createRequirement(req.body || {}, req.admin?.id);
      res.status(201).json({ requirement });
    }),
    updateRequirement: handle(async (req, res, service) => {
      const requirement = await service.updateRequirement(req.params.id, req.body || {});
      if (!requirement) return notFound("Requirement");
      res.json({ requirement });
    }),
    listAssignedJobs: handle(async (_req, res, service) =>
      res.json({ requirements: await service.listAssignedJobs() })
    ),
    matchCandidates: handle(async (req, res, service) => {
      const result = await service.matchCandidates(req.params.id, req.query.q);
      if (!result) return notFound("Requirement");
      res.json(result);
    }),
    searchCandidates: handle(async (req, res, service) =>
      res.json({ candidates: await service.searchCandidates(req.query.q) })
    ),

    listShortlists: handle(async (req, res, service) =>
      res.json({ shortlists: await service.listShortlists(req.query.requirementId) })
    ),
    createShortlist: handle(async (req, res, service) => {
      const shortlist = await service.createShortlist(req.body || {}, req.admin?.id);
      res.status(201).json({ shortlist });
    }),
    updateShortlist: handle(async (req, res, service) => {
      const shortlist = await service.updateShortlist(req.params.id, req.body || {});
      if (!shortlist) return notFound("Shortlist record");
      res.json({ shortlist });
    }),

    listSubmissions: handle(async (req, res, service) =>
      res.json({ submissions: await service.listSubmissions(req.query.requirementId) })
    ),
    createSubmission: handle(async (req, res, service) => {
      const submission = await service.createSubmission(req.body || {}, req.admin?.id);
      res.status(201).json({ submission });
    }),
    updateSubmission: handle(async (req, res, service) => {
      const submission = await service.updateSubmission(req.params.id, req.body || {});
      if (!submission) return notFound("Submission");
      res.json({ submission });
    }),

    listInterviews: handle(async (req, res, service) =>
      res.json({ interviews: await service.listInterviews(req.query.requirementId) })
    ),
    createInterview: handle(async (req, res, service) => {
      const interview = await service.createInterview(req.body || {}, req.admin?.id);
      res.status(201).json({ interview });
    }),
    updateInterview: handle(async (req, res, service) => {
      const interview = await service.updateInterview(req.params.id, req.body || {});
      if (!interview) return notFound("Interview");
      res.json({ interview });
    }),

    listPlacements: handle(async (req, res, service) =>
      res.json({ placements: await service.listPlacements(req.query.requirementId) })
    ),
    createPlacement: handle(async (req, res, service) => {
      const placement = await service.createPlacement(req.body || {}, req.admin?.id);
      res.status(201).json({ placement });
    }),
    updatePlacement: handle(async (req, res, service) => {
      const placement = await service.updatePlacement(req.params.id, req.body || {});
      if (!placement) return notFound("Offer or placement");
      res.json({ placement });
    }),
    getReports: handle(async (_req, res, service) => res.json(await service.getReports())),
  };
}

function notFound(entity) {
  const error = new Error(`${entity} not found.`);
  error.statusCode = 404;
  throw error;
}

module.exports = { createRecruitmentController };

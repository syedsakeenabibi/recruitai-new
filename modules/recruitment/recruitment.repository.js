const LEAD_COLUMNS = {
  createdBy: '"createdBy"',
  companyName: '"companyName"',
  companyWebsite: '"companyWebsite"',
  country: '"country"',
  location: '"location"',
  industry: '"industry"',
  source: '"source"',
  sourceUrl: '"sourceUrl"',
  hiringSignal: '"hiringSignal"',
  contactName: '"contactName"',
  contactTitle: '"contactTitle"',
  contactEmail: '"contactEmail"',
  contactLinkedInUrl: '"contactLinkedInUrl"',
  contactSource: '"contactSource"',
  status: '"status"',
  notes: '"notes"',
  campaignId: '"campaignId"',
  opportunityId: '"opportunityId"',
};
const REQUIREMENT_COLUMNS = {
  createdBy: '"createdBy"',
  companyLeadId: '"companyLeadId"',
  companyName: '"companyName"',
  jobTitle: '"jobTitle"',
  jobDescription: '"jobDescription"',
  education: '"education"',
  skills: '"skills"',
  experienceMin: '"experienceMin"',
  experienceMax: '"experienceMax"',
  country: '"country"',
  location: '"location"',
  employmentType: '"employmentType"',
  salaryMin: '"salaryMin"',
  salaryMax: '"salaryMax"',
  currency: '"currency"',
  openings: '"openings"',
  workMode: '"workMode"',
  noticePeriodPreference: '"noticePeriodPreference"',
  priority: '"priority"',
  bdmOwner: '"bdmOwner"',
  assignedRecruiter: '"assignedRecruiter"',
  status: '"status"',
};
const SHORTLIST_COLUMNS = {
  status: '"status"',
  outreachStatus: '"outreachStatus"',
  notes: '"notes"',
};
const SUBMISSION_COLUMNS = {
  status: '"status"',
  submittedAt: '"submittedAt"',
  clientFeedback: '"clientFeedback"',
  notes: '"notes"',
};
const INTERVIEW_COLUMNS = {
  companyName: '"companyName"',
  round: '"round"',
  scheduledAt: '"scheduledAt"',
  timezone: '"timezone"',
  mode: '"mode"',
  meetingLocation: '"meetingLocation"',
  status: '"status"',
  candidateFeedback: '"candidateFeedback"',
  clientFeedback: '"clientFeedback"',
};
const PLACEMENT_COLUMNS = {
  companyName: '"companyName"',
  offeredSalary: '"offeredSalary"',
  currency: '"currency"',
  offerDate: '"offerDate"',
  expectedJoiningDate: '"expectedJoiningDate"',
  actualJoiningDate: '"actualJoiningDate"',
  status: '"status"',
  notes: '"notes"',
};

function createRecruitmentRepository(db) {
  return {
    async listLeads() {
      const result = await db.query(
        `SELECT lead.*, campaign."name" AS "campaignName", opportunity."jobTitle" AS "opportunityJobTitle"
         FROM "CompanyLead" lead
         LEFT JOIN "BDMCampaign" campaign ON campaign."id" = lead."campaignId"
         LEFT JOIN "JobOpportunity" opportunity ON opportunity."id" = lead."opportunityId"
         ORDER BY lead."updatedAt" DESC, lead."companyName" ASC`
      );
      return result.rows;
    },
    async getOpportunity(id) {
      const result = await db.query(
        `SELECT "id", "campaignId", "source", "sourceUrl", "companyName", "companyWebsite", "country", "location"
         FROM "JobOpportunity" WHERE "id" = $1 LIMIT 1`,
        [id]
      );
      return result.rows[0] || null;
    },
    async getLead(id) {
      const result = await db.query(
        `SELECT "id", "companyName", "country", "location"
         FROM "CompanyLead" WHERE "id" = $1 LIMIT 1`,
        [id]
      );
      return result.rows[0] || null;
    },
    async createLead(data, createdBy) {
      const result = await insertRow(db, "CompanyLead", {
        ...data,
        createdBy: createdBy ?? null,
      }, LEAD_COLUMNS, true);
      return result;
    },
    updateLead: (id, data) => updateRow(db, "CompanyLead", id, data, LEAD_COLUMNS),

    async listRequirements(status) {
      if (status) {
        const result = await db.query(
          `SELECT requirement.*, lead."contactName", lead."contactEmail"
           FROM "ClientRequirement" requirement
           LEFT JOIN "CompanyLead" lead ON lead."id" = requirement."companyLeadId"
           WHERE requirement."status" = $1
           ORDER BY requirement."priority" DESC, requirement."updatedAt" DESC`,
          [status]
        );
        return result.rows;
      }
      const result = await db.query(
        `SELECT requirement.*, lead."contactName", lead."contactEmail"
         FROM "ClientRequirement" requirement
         LEFT JOIN "CompanyLead" lead ON lead."id" = requirement."companyLeadId"
         ORDER BY requirement."priority" DESC, requirement."updatedAt" DESC`
      );
      return result.rows;
    },
    async getRequirement(id) {
      const result = await db.query(
        `SELECT requirement.*, lead."contactName", lead."contactEmail"
         FROM "ClientRequirement" requirement
         LEFT JOIN "CompanyLead" lead ON lead."id" = requirement."companyLeadId"
         WHERE requirement."id" = $1 LIMIT 1`,
        [id]
      );
      return result.rows[0] || null;
    },
    async createRequirement(data, createdBy) {
      return insertRow(db, "ClientRequirement", {
        ...data,
        createdBy: createdBy ?? null,
      }, REQUIREMENT_COLUMNS, true);
    },
    updateRequirement: (id, data) => updateRow(db, "ClientRequirement", id, data, REQUIREMENT_COLUMNS),
    async listAssignedJobs() {
      const result = await db.query(
        `SELECT * FROM "ClientRequirement"
         WHERE "status" IN ('CONFIRMED', 'ASSIGNED', 'SOURCING', 'SUBMITTED', 'INTERVIEW', 'OFFER')
         ORDER BY "priority" DESC, "updatedAt" DESC`
      );
      return result.rows;
    },
    async searchCandidates(search) {
      const value = typeof search === "string" ? search.trim() : "";
      const result = await db.query(
        `SELECT "id", "name", "email", "phone", "location", "country", "currentTitle",
                "currentCompany", "industry", "experienceYears", "education", "degree",
                "specialization", "skills", "preferredRoles", "preferredLocations",
                "workPreference", "employmentType", "expectedSalary", "noticeDays",
                "availability", "source", "resumeFileName", "resumeMimeType", "createdAt"
         FROM "Candidate"
         WHERE "source" <> 'SYNTHETIC'
           AND ($1 = '' OR CONCAT_WS(' ', "name", "email", "phone", "location", "country",
                "currentTitle", "currentCompany", "industry", "education", "degree",
                "specialization", "source", "resumeFileName",
                ARRAY_TO_STRING("skills", ' '), ARRAY_TO_STRING("preferredRoles", ' '),
                ARRAY_TO_STRING("preferredLocations", ' ')) ILIKE '%' || $1 || '%')
         ORDER BY "createdAt" DESC
        `,
        [value]
      );
      return result.rows;
    },

    async listShortlists(requirementId) {
      const result = requirementId
        ? await db.query(
            `SELECT shortlist.*, candidate."name" AS "candidateName", candidate."email",
                    candidate."currentTitle", candidate."skills", requirement."jobTitle"
             FROM "RequirementShortlist" shortlist
             JOIN "Candidate" candidate ON candidate."id" = shortlist."candidateId"
             JOIN "ClientRequirement" requirement ON requirement."id" = shortlist."requirementId"
             WHERE shortlist."requirementId" = $1
             ORDER BY shortlist."createdAt" DESC`,
            [requirementId]
          )
        : await db.query(
            `SELECT shortlist.*, candidate."name" AS "candidateName", candidate."email",
                    candidate."currentTitle", candidate."skills", requirement."jobTitle"
             FROM "RequirementShortlist" shortlist
             JOIN "Candidate" candidate ON candidate."id" = shortlist."candidateId"
             JOIN "ClientRequirement" requirement ON requirement."id" = shortlist."requirementId"
             ORDER BY shortlist."createdAt" DESC`
          );
      return result.rows;
    },
    async createShortlist(data) {
      return insertRow(db, "RequirementShortlist", data, {
        requirementId: '"requirementId"',
        candidateId: '"candidateId"',
        status: '"status"',
        outreachStatus: '"outreachStatus"',
        notes: '"notes"',
        createdBy: '"createdBy"',
      }, true);
    },
    updateShortlist: (id, data) => updateRow(db, "RequirementShortlist", id, data, SHORTLIST_COLUMNS),

    async listSubmissions(requirementId) {
      return listLinked(db, "CandidateSubmission", requirementId);
    },
    async createSubmission(data) {
      return insertRow(db, "CandidateSubmission", data, {
        candidateId: '"candidateId"',
        requirementId: '"requirementId"',
        submittedBy: '"submittedBy"',
        submittedAt: '"submittedAt"',
        status: '"status"',
        clientFeedback: '"clientFeedback"',
        notes: '"notes"',
      }, true);
    },
    updateSubmission: (id, data) => updateRow(db, "CandidateSubmission", id, data, SUBMISSION_COLUMNS),

    async listInterviews(requirementId) {
      return listLinked(db, "RecruitmentInterview", requirementId);
    },
    async createInterview(data) {
      return insertRow(db, "RecruitmentInterview", data, {
        candidateId: '"candidateId"',
        requirementId: '"requirementId"',
        companyName: '"companyName"',
        round: '"round"',
        scheduledAt: '"scheduledAt"',
        timezone: '"timezone"',
        mode: '"mode"',
        meetingLocation: '"meetingLocation"',
        status: '"status"',
        candidateFeedback: '"candidateFeedback"',
        clientFeedback: '"clientFeedback"',
        createdBy: '"createdBy"',
      }, true);
    },
    updateInterview: (id, data) => updateRow(db, "RecruitmentInterview", id, data, INTERVIEW_COLUMNS),

    async listPlacements(requirementId) {
      return listLinked(db, "RecruitmentPlacement", requirementId);
    },
    async createPlacement(data) {
      return insertRow(db, "RecruitmentPlacement", data, {
        candidateId: '"candidateId"',
        requirementId: '"requirementId"',
        companyName: '"companyName"',
        offeredSalary: '"offeredSalary"',
        currency: '"currency"',
        offerDate: '"offerDate"',
        expectedJoiningDate: '"expectedJoiningDate"',
        actualJoiningDate: '"actualJoiningDate"',
        status: '"status"',
        notes: '"notes"',
        createdBy: '"createdBy"',
      }, true);
    },
    updatePlacement: (id, data) => updateRow(db, "RecruitmentPlacement", id, data, PLACEMENT_COLUMNS),

    async getReports() {
      const [candidateCount, requirements, leads, submissions, interviews, placements] = await Promise.all([
        db.query(`SELECT COUNT(*)::integer AS count FROM "Candidate"`),
        db.query(`SELECT "status", COUNT(*)::integer AS count FROM "ClientRequirement" GROUP BY "status"`),
        db.query(`SELECT "status", COUNT(*)::integer AS count FROM "CompanyLead" GROUP BY "status"`),
        db.query(`SELECT "status", COUNT(*)::integer AS count FROM "CandidateSubmission" GROUP BY "status"`),
        db.query(`SELECT "status", COUNT(*)::integer AS count FROM "RecruitmentInterview" GROUP BY "status"`),
        db.query(`SELECT "status", COUNT(*)::integer AS count FROM "RecruitmentPlacement" GROUP BY "status"`),
      ]);
      return {
        candidateCount: candidateCount.rows[0].count,
        requirements: countByStatus(requirements.rows),
        leads: countByStatus(leads.rows),
        submissions: countByStatus(submissions.rows),
        interviews: countByStatus(interviews.rows),
        placements: countByStatus(placements.rows),
      };
    },
  };
}

async function listLinked(db, table, requirementId) {
  const join = `SELECT record.*, candidate."name" AS "candidateName", candidate."email",
                       candidate."currentTitle", requirement."jobTitle", requirement."companyName"
                FROM "${table}" record
                JOIN "Candidate" candidate ON candidate."id" = record."candidateId"
                JOIN "ClientRequirement" requirement ON requirement."id" = record."requirementId"`;
  const result = requirementId
    ? await db.query(`${join} WHERE record."requirementId" = $1 ORDER BY record."createdAt" DESC`, [requirementId])
    : await db.query(`${join} ORDER BY record."createdAt" DESC`);
  return result.rows;
}

async function insertRow(db, table, data, columns, withId = false) {
  const entries = Object.entries(data).filter(([key]) => columns[key]);
  const fields = withId ? ['"id"', ...entries.map(([key]) => columns[key])] : entries.map(([key]) => columns[key]);
  const values = withId ? [makeId(), ...entries.map(([, value]) => value)] : entries.map(([, value]) => value);
  const placeholders = values.map((_, index) => `$${index + 1}`);
  const result = await db.query(
    `INSERT INTO "${table}" (${fields.join(", ")}) VALUES (${placeholders.join(", ")}) RETURNING *`,
    values
  );
  return result.rows[0];
}

async function updateRow(db, table, id, data, columns) {
  const entries = Object.entries(data);
  const assignments = entries.map(([key], index) => {
    const column = columns[key];
    if (!column) throw new Error(`Unsupported update field: ${key}.`);
    return `${column} = $${index + 1}`;
  });
  assignments.push('"updatedAt" = CURRENT_TIMESTAMP');
  const values = entries.map(([, value]) => value);
  values.push(id);
  const result = await db.query(
    `UPDATE "${table}" SET ${assignments.join(", ")} WHERE "id" = $${values.length} RETURNING *`,
    values
  );
  return result.rows[0] || null;
}

function countByStatus(rows) {
  return Object.fromEntries(rows.map((row) => [row.status, row.count]));
}

function makeId() {
  return `rc_${require("crypto").randomUUID()}`;
}

module.exports = { createRecruitmentRepository };

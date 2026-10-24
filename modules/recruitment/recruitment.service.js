const { createRecruitmentRepository } = require("./recruitment.repository");

const LEAD_STATUSES = new Set([
  "TARGET", "CONTACTED", "RESPONDED", "INTERESTED",
  "REQUIREMENT_CONFIRMED", "HANDED_TO_RECRUITER", "CLOSED", "LOST",
]);
const REQUIREMENT_STATUSES = new Set([
  "DRAFT", "CONFIRMED", "ASSIGNED", "SOURCING", "SUBMITTED",
  "INTERVIEW", "OFFER", "PLACED", "CLOSED", "CANCELLED",
]);
const SUBMISSION_STATUSES = new Set([
  "DRAFT", "APPROVED", "SUBMITTED", "SHORTLISTED", "REJECTED",
  "INTERVIEW", "OFFER", "PLACED",
]);
const INTERVIEW_STATUSES = new Set([
  "SCHEDULED", "COMPLETED", "RESCHEDULED", "CANCELLED", "PASSED", "REJECTED",
]);
const PLACEMENT_STATUSES = new Set([
  "OFFER_PENDING", "OFFERED", "ACCEPTED", "DECLINED", "JOINED", "NO_SHOW", "PLACED",
]);

function createRecruitmentService(db) {
  const repository = createRecruitmentRepository(db);

  return {
    listLeads: () => repository.listLeads(),
    async createLead(input, createdBy) {
      const data = copyAllowed(input, LEAD_FIELDS);
      normalizeTextFields(data, LEAD_FIELDS.filter((field) => !["status"].includes(field)));
      if (data.status && !LEAD_STATUSES.has(data.status)) invalid("Unsupported company lead status.");
      if (data.contactEmail && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(data.contactEmail)) invalid("contactEmail must be a valid email address.");
      if (!data.status) data.status = "TARGET";
      if (data.opportunityId) {
        const opportunity = await repository.getOpportunity(data.opportunityId);
        if (!opportunity) invalid("The linked opportunity does not exist.");
        for (const field of ["companyName", "companyWebsite", "country", "location", "source", "sourceUrl"]) {
          if (data[field] == null) data[field] = opportunity[field] ?? null;
        }
        if (!data.campaignId) data.campaignId = opportunity.campaignId;
      }
      if (!data.companyName && !data.opportunityId && !data.sourceUrl) {
        invalid("Provide a company name, a source URL, or link an existing opportunity.");
      }
      return repository.createLead(data, createdBy);
    },
    async updateLead(id, input) {
      const data = copyAllowed(input, LEAD_FIELDS);
      if (!Object.keys(data).length) invalid("Provide at least one supported lead field.");
      normalizeTextFields(data, LEAD_FIELDS.filter((field) => !["status"].includes(field)));
      if (data.status && !LEAD_STATUSES.has(data.status)) invalid("Unsupported company lead status.");
      if (data.contactEmail && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(data.contactEmail)) invalid("contactEmail must be a valid email address.");
      return repository.updateLead(id, data);
    },

    listRequirements: (status) => repository.listRequirements(status),
    getRequirement: (id) => repository.getRequirement(id),
    async createRequirement(input, createdBy) {
      const data = copyAllowed(input, REQUIREMENT_FIELDS);
      normalizeTextFields(data, REQUIREMENT_FIELDS.filter((field) => !["skills", "experienceMin", "experienceMax", "salaryMin", "salaryMax", "openings", "priority", "status"].includes(field)));
      required(data, ["jobTitle"]);
      if (data.status && data.status !== "DRAFT" && data.status !== "CONFIRMED") {
        invalid("New requirements can only be DRAFT or CONFIRMED.");
      }
      if (!data.status) data.status = "DRAFT";
      validateRequirement(data);
      if (data.companyLeadId) {
        const lead = await repository.getLead(data.companyLeadId);
        if (!lead) invalid("The linked company lead does not exist.");
        for (const field of ["companyName", "country", "location"]) {
          if (data[field] == null) data[field] = lead[field] ?? null;
        }
      }
      return repository.createRequirement(data, createdBy);
    },
    async updateRequirement(id, input) {
      const data = copyAllowed(input, REQUIREMENT_FIELDS);
      if (!Object.keys(data).length) invalid("Provide at least one supported requirement field.");
      normalizeTextFields(data, REQUIREMENT_FIELDS.filter((field) => !["skills", "experienceMin", "experienceMax", "salaryMin", "salaryMax", "openings", "priority", "status"].includes(field)));
      if (data.status && !REQUIREMENT_STATUSES.has(data.status)) invalid("Unsupported requirement status.");
      validateRequirement(data);
      if (data.status) {
        const existing = await repository.getRequirement(id);
        if (!existing) return null;
        if (existing.status === "DRAFT" && !["CONFIRMED", "CANCELLED"].includes(data.status)) {
          invalid("A draft requirement must be confirmed before entering recruiter workflow.");
        }
        if (data.status === "ASSIGNED" && !(data.assignedRecruiter || existing.assignedRecruiter)) {
          invalid("Assign a recruiter before moving the requirement to ASSIGNED.");
        }
      }
      return repository.updateRequirement(id, data);
    },
    listAssignedJobs: () => repository.listAssignedJobs(),
    async matchCandidates(id, search) {
      const requirement = await repository.getRequirement(id);
      if (!requirement) return null;
      const candidates = await repository.searchCandidates(search);
      return {
        requirement,
        candidates: candidates.map((candidate) => rankCandidate(candidate, requirement)),
      };
    },
    searchCandidates: (search) => repository.searchCandidates(search),

    listShortlists: (requirementId) => repository.listShortlists(requirementId),
    async createShortlist(input, createdBy) {
      required(input, ["requirementId", "candidateId"]);
      const requirement = await repository.getRequirement(input.requirementId);
      if (!requirement || !["CONFIRMED", "ASSIGNED", "SOURCING", "SUBMITTED", "INTERVIEW", "OFFER"].includes(requirement.status)) {
        invalid("Only confirmed or active requirements can have candidates shortlisted.");
      }
      return repository.createShortlist({
        requirementId: input.requirementId,
        candidateId: input.candidateId,
        status: "SHORTLISTED",
        outreachStatus: "NOT_CONTACTED",
        notes: cleanOptional(input.notes),
        createdBy,
      });
    },
    async updateShortlist(id, input) {
      const data = copyAllowed(input, ["status", "outreachStatus", "notes"]);
      if (!Object.keys(data).length) invalid("Provide at least one supported shortlist field.");
      if (data.status && !new Set(["SHORTLISTED", "ON_HOLD", "REMOVED"]).has(data.status)) invalid("Unsupported shortlist status.");
      if (data.outreachStatus && !new Set(["NOT_CONTACTED", "CONTACTED", "RESPONDED", "INTERESTED", "DECLINED"]).has(data.outreachStatus)) invalid("Unsupported outreach status.");
      return repository.updateShortlist(id, data);
    },

    listSubmissions: (requirementId) => repository.listSubmissions(requirementId),
    async createSubmission(input, submittedBy) {
      required(input, ["candidateId", "requirementId"]);
      const requirement = await repository.getRequirement(input.requirementId);
      if (!requirement || requirement.status === "DRAFT" || requirement.status === "CANCELLED") {
        invalid("Only confirmed or active requirements can receive submissions.");
      }
      const status = input.status || "DRAFT";
      if (!SUBMISSION_STATUSES.has(status)) invalid("Unsupported submission status.");
      return repository.createSubmission({
        candidateId: input.candidateId,
        requirementId: input.requirementId,
        submittedBy,
        submittedAt: status === "SUBMITTED" ? new Date().toISOString() : null,
        status,
        clientFeedback: cleanOptional(input.clientFeedback),
        notes: cleanOptional(input.notes),
      });
    },
    async updateSubmission(id, input) {
      const data = copyAllowed(input, ["status", "clientFeedback", "notes"]);
      if (!Object.keys(data).length) invalid("Provide at least one supported submission field.");
      if (data.status && !SUBMISSION_STATUSES.has(data.status)) invalid("Unsupported submission status.");
      if (data.status === "SUBMITTED") data.submittedAt = new Date().toISOString();
      return repository.updateSubmission(id, data);
    },

    listInterviews: (requirementId) => repository.listInterviews(requirementId),
    async createInterview(input, createdBy) {
      required(input, ["candidateId", "requirementId"]);
      const requirement = await repository.getRequirement(input.requirementId);
      if (!requirement || requirement.status === "DRAFT" || requirement.status === "CANCELLED") {
        invalid("Only confirmed or active requirements can have interviews.");
      }
      const status = input.status || "SCHEDULED";
      if (!INTERVIEW_STATUSES.has(status)) invalid("Unsupported interview status.");
      return repository.createInterview({
        candidateId: input.candidateId,
        requirementId: input.requirementId,
        companyName: cleanOptional(input.companyName) ?? requirement.companyName,
        round: cleanOptional(input.round),
        scheduledAt: validateDate(input.scheduledAt, "scheduledAt"),
        timezone: cleanOptional(input.timezone),
        mode: cleanOptional(input.mode),
        meetingLocation: cleanOptional(input.meetingLocation),
        status,
        candidateFeedback: cleanOptional(input.candidateFeedback),
        clientFeedback: cleanOptional(input.clientFeedback),
        createdBy,
      });
    },
    async updateInterview(id, input) {
      const data = copyAllowed(input, ["companyName", "round", "scheduledAt", "timezone", "mode", "meetingLocation", "status", "candidateFeedback", "clientFeedback"]);
      if (!Object.keys(data).length) invalid("Provide at least one supported interview field.");
      if (data.status && !INTERVIEW_STATUSES.has(data.status)) invalid("Unsupported interview status.");
      if (Object.hasOwn(data, "scheduledAt")) data.scheduledAt = validateDate(data.scheduledAt, "scheduledAt");
      return repository.updateInterview(id, data);
    },

    listPlacements: (requirementId) => repository.listPlacements(requirementId),
    async createPlacement(input, createdBy) {
      required(input, ["candidateId", "requirementId"]);
      const requirement = await repository.getRequirement(input.requirementId);
      if (!requirement || requirement.status === "DRAFT" || requirement.status === "CANCELLED") {
        invalid("Only confirmed or active requirements can have offers or placements.");
      }
      const status = input.status || "OFFER_PENDING";
      if (!PLACEMENT_STATUSES.has(status)) invalid("Unsupported offer or placement status.");
      return repository.createPlacement({
        candidateId: input.candidateId,
        requirementId: input.requirementId,
        companyName: cleanOptional(input.companyName) ?? requirement.companyName,
        offeredSalary: optionalNumber(input.offeredSalary, "offeredSalary"),
        currency: cleanOptional(input.currency),
        offerDate: validateDate(input.offerDate, "offerDate"),
        expectedJoiningDate: validateDate(input.expectedJoiningDate, "expectedJoiningDate"),
        actualJoiningDate: validateDate(input.actualJoiningDate, "actualJoiningDate"),
        status,
        notes: cleanOptional(input.notes),
        createdBy,
      });
    },
    async updatePlacement(id, input) {
      const data = copyAllowed(input, ["companyName", "offeredSalary", "currency", "offerDate", "expectedJoiningDate", "actualJoiningDate", "status", "notes"]);
      if (!Object.keys(data).length) invalid("Provide at least one supported offer or placement field.");
      if (data.status && !PLACEMENT_STATUSES.has(data.status)) invalid("Unsupported offer or placement status.");
      if (Object.hasOwn(data, "offeredSalary")) data.offeredSalary = optionalNumber(data.offeredSalary, "offeredSalary");
      for (const field of ["offerDate", "expectedJoiningDate", "actualJoiningDate"]) {
        if (Object.hasOwn(data, field)) data[field] = validateDate(data[field], field);
      }
      return repository.updatePlacement(id, data);
    },
    getReports: () => repository.getReports(),
  };
}

const LEAD_FIELDS = [
  "companyName", "companyWebsite", "country", "location", "industry", "source",
  "sourceUrl", "hiringSignal", "contactName", "contactTitle", "contactEmail",
  "contactLinkedInUrl", "contactSource", "status", "notes", "campaignId", "opportunityId",
];
const REQUIREMENT_FIELDS = [
  "companyLeadId", "companyName", "jobTitle", "jobDescription", "education", "skills",
  "experienceMin", "experienceMax", "country", "location", "employmentType",
  "salaryMin", "salaryMax", "currency", "openings", "workMode",
  "noticePeriodPreference", "priority", "bdmOwner", "assignedRecruiter", "status",
];

function rankCandidate(candidate, requirement) {
  const requiredSkills = normalizeArray(requirement.skills);
  const candidateSkills = normalizeArray(candidate.skills);
  const matchedSkills = requiredSkills.filter((skill) =>
    candidateSkills.some((candidateSkill) => candidateSkill === skill || candidateSkill.includes(skill) || skill.includes(candidateSkill))
  );
  const missingRequirements = requiredSkills.filter((skill) => !matchedSkills.includes(skill));
  let earned = 0;
  let possible = 0;

  if (requiredSkills.length) {
    possible += 35;
    earned += 35 * (matchedSkills.length / requiredSkills.length);
  }

  let experienceFit = "NOT_SPECIFIED";
  if (candidate.experienceYears != null && (requirement.experienceMin != null || requirement.experienceMax != null)) {
    possible += 15;
    const years = Number(candidate.experienceYears);
    const meetsMinimum = requirement.experienceMin == null || years >= Number(requirement.experienceMin);
    const meetsMaximum = requirement.experienceMax == null || years <= Number(requirement.experienceMax);
    experienceFit = meetsMinimum && meetsMaximum ? "MEETS" : "DOES_NOT_MEET";
    if (meetsMinimum && meetsMaximum) earned += 15;
    else missingRequirements.push("Experience range");
  }

  const titleRequirement = String(requirement.jobTitle || "").toLowerCase();
  const candidateTitle = String(candidate.currentTitle || "").toLowerCase();
  const preferredRoles = normalizeArray(candidate.preferredRoles);
  const candidateRoles = [candidateTitle, ...preferredRoles].filter(Boolean);
  const roleMatches = Boolean(titleRequirement && candidateRoles.some((role) =>
    role.includes(titleRequirement) || titleRequirement.includes(role)
  ));
  if (titleRequirement) {
    possible += 15;
    if (roleMatches) earned += 15;
    else missingRequirements.push("Relevant title or preferred role");
  }

  let locationFit = "NOT_SPECIFIED";
  if (requirement.country || requirement.location) {
    possible += 10;
    const candidateLocations = [candidate.country, candidate.location, ...(candidate.preferredLocations || [])]
      .filter(Boolean).map((value) => String(value).toLowerCase());
    const targets = [requirement.country, requirement.location].filter(Boolean).map((value) => String(value).toLowerCase());
    locationFit = targets.some((target) => candidateLocations.some((value) => value.includes(target) || target.includes(value))) ? "MATCH" : "NO_MATCH";
    if (locationFit === "MATCH") earned += 10;
    else missingRequirements.push("Location preference");
  }

  let educationFit = "NOT_SPECIFIED";
  if (requirement.education) {
    possible += 10;
    const candidateEducation = `${candidate.education || ""} ${candidate.degree || ""} ${candidate.specialization || ""}`.toLowerCase();
    educationFit = candidateEducation.includes(String(requirement.education).toLowerCase()) ? "MATCH" : "NO_MATCH";
    if (educationFit === "MATCH") earned += 10;
    else missingRequirements.push("Education");
  }

  let noticePeriodFit = "NOT_SPECIFIED";
  const noticeDays = parseNoticeDays(requirement.noticePeriodPreference);
  if (noticeDays != null && candidate.noticeDays != null) {
    possible += 7;
    noticePeriodFit = Number(candidate.noticeDays) <= noticeDays ? "MEETS" : "DOES_NOT_MEET";
    if (noticePeriodFit === "MEETS") earned += 7;
    else missingRequirements.push("Notice period");
  }

  let salaryFit = "NOT_SPECIFIED";
  if (candidate.expectedSalary != null && (requirement.salaryMin != null || requirement.salaryMax != null)) {
    possible += 8;
    const expected = Number(candidate.expectedSalary);
    const meetsMin = requirement.salaryMin == null || expected >= Number(requirement.salaryMin);
    const meetsMax = requirement.salaryMax == null || expected <= Number(requirement.salaryMax);
    salaryFit = meetsMin && meetsMax ? "WITHIN_RANGE" : "OUTSIDE_RANGE";
    if (meetsMin && meetsMax) earned += 8;
    else missingRequirements.push("Salary expectation");
  }

  const matchScore = possible ? Math.round((earned / possible) * 100) : 0;
  const reason = [
    `${matchedSkills.length} of ${requiredSkills.length} required skills matched`,
    experienceFit === "NOT_SPECIFIED" ? "experience fit not assessable" : `experience ${experienceFit.toLowerCase().replace("_", " ")}`,
    locationFit === "NOT_SPECIFIED" ? "location fit not assessable" : `location ${locationFit.toLowerCase().replace("_", " ")}`,
    educationFit === "NOT_SPECIFIED" ? "education fit not assessable" : `education ${educationFit.toLowerCase()}`,
    noticePeriodFit === "NOT_SPECIFIED" ? "notice period fit not assessable" : `notice period ${noticePeriodFit.toLowerCase().replace("_", " ")}`,
    salaryFit === "NOT_SPECIFIED" ? "salary fit not assessable" : `salary ${salaryFit.toLowerCase().replace("_", " ")}`,
    "Recruiter review required; this score does not reject candidates.",
  ].join("; ");

  return { ...candidate, matchScore, matchedSkills, missingRequirements, experienceFit, locationFit, educationFit, noticePeriodFit, salaryFit, reason };
}

function normalizeArray(value) {
  return (Array.isArray(value) ? value : []).filter(Boolean).map((item) => String(item).trim().toLowerCase());
}

function parseNoticeDays(value) {
  if (!value) return null;
  const match = String(value).toLowerCase().match(/(\d+(?:\.\d+)?)\s*(day|week|month)/);
  if (!match) return null;
  const amount = Number(match[1]);
  if (match[2] === "week") return amount * 7;
  if (match[2] === "month") return amount * 30;
  return amount;
}

function copyAllowed(input, allowed) {
  const result = {};
  for (const field of allowed) {
    if (Object.hasOwn(input, field)) result[field] = input[field];
  }
  return result;
}

function required(input, fields) {
  const missing = fields.filter((field) => input[field] == null || String(input[field]).trim() === "");
  if (missing.length) invalid(`${missing.join(", ")} ${missing.length === 1 ? "is" : "are"} required.`);
}

function validateRequirement(data) {
  if (data.skills != null && (!Array.isArray(data.skills) || data.skills.some((skill) => typeof skill !== "string"))) {
    invalid("skills must be an array of strings.");
  }
  for (const field of ["experienceMin", "experienceMax", "salaryMin", "salaryMax", "priority", "openings"]) {
    if (Object.hasOwn(data, field) && data[field] != null) data[field] = optionalNumber(data[field], field);
  }
  if (Object.hasOwn(data, "openings") && data.openings == null) invalid("openings must be a positive whole number.");
  if (Object.hasOwn(data, "priority") && data.priority == null) invalid("priority must be a non-negative whole number.");
  if (Object.hasOwn(data, "openings") && data.openings != null && (!Number.isInteger(data.openings) || data.openings < 1)) invalid("openings must be a positive whole number.");
  if (Object.hasOwn(data, "priority") && data.priority != null && (!Number.isInteger(data.priority) || data.priority < 0)) invalid("priority must be a non-negative whole number.");
  for (const pair of [["experienceMin", "experienceMax"], ["salaryMin", "salaryMax"]]) {
    const [min, max] = pair;
    if (data[min] != null && data[max] != null && data[min] > data[max]) invalid(`${min} must not exceed ${max}.`);
  }
}

function optionalNumber(value, field) {
  if (value === null || value === "") return null;
  const number = Number(value);
  if (!Number.isFinite(number) || number < 0) invalid(`${field} must be a non-negative number.`);
  return number;
}

function cleanOptional(value) {
  if (value == null || value === "") return null;
  return String(value).trim();
}

function validateDate(value, field) {
  const date = cleanOptional(value);
  if (date && Number.isNaN(Date.parse(date))) invalid(`${field} must be a valid date and time.`);
  return date;
}

function normalizeTextFields(data, fields) {
  for (const field of fields) {
    if (!Object.hasOwn(data, field) || data[field] == null) continue;
    if (typeof data[field] !== "string") invalid(`${field} must be text.`);
    data[field] = data[field].trim() || null;
  }
}

function invalid(message) {
  const error = new Error(message);
  error.statusCode = 400;
  throw error;
}

module.exports = { createRecruitmentService, rankCandidate };

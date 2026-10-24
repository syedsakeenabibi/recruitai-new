const { ValidationError } = require("../bdm/bdm.validation");

function asOptionalArray(value, fieldName) {
  if (value === undefined || value === null) return [];
  if (!Array.isArray(value)) {
    throw new ValidationError(`${fieldName} must be an array of strings.`);
  }
  if (value.some((item) => typeof item !== "string")) {
    throw new ValidationError(`${fieldName} must be an array of strings.`);
  }
  return value.map((item) => item.trim()).filter(Boolean);
}

function optionalText(input, fieldName, maxLength) {
  const value = input[fieldName];
  if (value === undefined || value === null || value === "") return null;
  if (typeof value !== "string") {
    throw new ValidationError(`${fieldName} must be text.`);
  }
  const normalized = value.trim();
  if (normalized.length > maxLength) {
    throw new ValidationError(`${fieldName} must be at most ${maxLength} characters.`);
  }
  return normalized || null;
}

function validateDiscoveryRequest(input = {}) {
  if (!input || typeof input !== "object" || Array.isArray(input)) {
    throw new ValidationError("A JSON object is required.");
  }

  const allowedKeys = new Set([
    "campaignId",
    "country",
    "roles",
    "industries",
    "locations",
    "keywords",
    "employmentTypes",
    "experienceMin",
    "experienceMax",
  ]);
  const unknown = Object.keys(input).find((key) => !allowedKeys.has(key));
  if (unknown) throw new ValidationError(`Unknown field: ${unknown}.`);

  const campaignId = typeof input.campaignId === "string" && input.campaignId.trim() ? input.campaignId.trim() : null;
  const country = typeof input.country === "string" && input.country.trim() ? input.country.trim().toUpperCase() : null;

  if (country && !["US", "UK"].includes(country)) {
    throw new ValidationError("country must be one of: US, UK.");
  }

  return {
    campaignId,
    country,
    roles: asOptionalArray(input.roles, "roles"),
    industries: asOptionalArray(input.industries, "industries"),
    locations: asOptionalArray(input.locations, "locations"),
    keywords: asOptionalArray(input.keywords, "keywords"),
    employmentTypes: asOptionalArray(input.employmentTypes, "employmentTypes"),
    experienceMin:
      input.experienceMin === undefined || input.experienceMin === null
        ? null
        : Number(input.experienceMin),
    experienceMax:
      input.experienceMax === undefined || input.experienceMax === null
        ? null
        : Number(input.experienceMax),
  };
}

function validateLiveDiscoveryRequest(input = {}) {
  if (!input || typeof input !== "object" || Array.isArray(input)) {
    throw new ValidationError("A JSON object is required.");
  }
  const allowed = new Set([
    "campaignId", "country", "category", "title", "keywords", "company",
    "location", "source", "after", "before", "boards", "onlyRequestedBoards", "pages",
  ]);
  const unknown = Object.keys(input).find((key) => !allowed.has(key));
  if (unknown) throw new ValidationError(`Unknown field: ${unknown}.`);

  const country = optionalText(input, "country", 8)?.toUpperCase() || "BOTH";
  if (!["US", "UK", "BOTH"].includes(country)) {
    throw new ValidationError("country must be US, UK, or BOTH.");
  }
  const category = optionalText(input, "category", 16)?.toUpperCase() || "BOTH";
  if (!["IT", "NON-IT", "BOTH"].includes(category)) {
    throw new ValidationError("category must be IT, NON-IT, or BOTH.");
  }

  const source = optionalText(input, "source", 24)?.toUpperCase() || "BOTH";
 const allowedSources = [
  "GREENHOUSE",
  "LEVER",
  "ASHBY",
  "SMARTRECRUITERS",
  "W3GLOBAL",
  "JOOBLE",
  "ADZUNA",
  "USAJOBS",
  "BOTH",
  "ALL",
];

if (!allowedSources.includes(source)) {
  throw new ValidationError(
    `source must be one of: ${allowedSources.join(", ")}.`
  );
}

  const keywords = input.keywords === undefined || input.keywords === null
    ? []
    : Array.isArray(input.keywords) && input.keywords.every((item) => typeof item === "string")
      ? input.keywords.map((item) => item.trim()).filter(Boolean).slice(0, 12)
      : (() => { throw new ValidationError("keywords must be an array of strings."); })();
  const boards = input.boards === undefined || input.boards === null
    ? []
    : Array.isArray(input.boards) && input.boards.length <= 12 && input.boards.every((item) =>
      item && typeof item === "object" && typeof item.provider === "string" && typeof item.slug === "string"
    )
      ? input.boards
      : (() => { throw new ValidationError("boards must be an array of up to 12 provider/slug values."); })();

  const after = optionalText(input, "after", 40);
  const before = optionalText(input, "before", 40);
  for (const [name, value] of [["after", after], ["before", before]]) {
    if (value && Number.isNaN(Date.parse(value))) throw new ValidationError(`${name} must be a valid date.`);
  }
  if (after && before && new Date(after) > new Date(before)) throw new ValidationError("after must not be later than before.");

  return {
    campaignId: optionalText(input, "campaignId", 128),
    country,
    category,
    title: optionalText(input, "title", 120),
    keywords,
    company: optionalText(input, "company", 120),
    location: optionalText(input, "location", 120),
    source,
    onlyRequestedBoards: input.onlyRequestedBoards === true,
    pages: input.pages == null || input.pages === "" ? 1 : Math.max(1, Math.min(100, Math.floor(Number(input.pages) || 1))),
    after,
    before,
    boards,
  };
}

function validateSaveLiveOpportunity(input = {}) {
  if (!input || typeof input !== "object" || Array.isArray(input)) {
    throw new ValidationError("A JSON object is required.");
  }
  const allowed = new Set(["campaignId", "provider", "board", "externalId"]);
  const unknown = Object.keys(input).find((key) => !allowed.has(key));
  if (unknown) throw new ValidationError(`Unknown field: ${unknown}.`);
  const provider = optionalText(input, "provider", 24)?.toUpperCase();
  if (!["GREENHOUSE", "LEVER", "ASHBY", "SMARTRECRUITERS"].includes(provider)) throw new ValidationError("A supported ATS provider is required.");
  const board = optionalText(input, "board", 80);
  const externalId = optionalText(input, "externalId", 200);
  if (!board || !externalId) throw new ValidationError("board and externalId are required.");
  return {
    campaignId: optionalText(input, "campaignId", 128),
    provider,
    board,
    externalId,
  };
}

function validateFindHiringContactsRequest(input = {}, opportunityId) {
  if (!input || typeof input !== "object" || Array.isArray(input)) {
    throw new ValidationError("A JSON object is required.");
  }
  if (Object.keys(input).length) {
    throw new ValidationError("Contact discovery does not accept client-supplied contact details.");
  }
  const id = typeof opportunityId === "string" ? opportunityId.trim() : "";
  if (!id || id.length > 128) {
    throw new ValidationError("A valid saved opportunity ID is required.");
  }
  return { opportunityId: id };
}


function validateSearchUrlRequest(input = {}) {
  if (!input || typeof input !== "object" || Array.isArray(input)) {
    throw new ValidationError("A JSON object is required.");
  }

  const allowed = new Set([
    "url",
    "country",
    "category",
    "keyword",
    "keywords",
    "location",
    "pages",
  ]);

  const unknown = Object.keys(input).find((key) => !allowed.has(key));
  if (unknown) throw new ValidationError(`Unknown field: ${unknown}.`);

  const url = optionalText(input, "url", 2048) || "";
  const keyword = (
    optionalText(input, "keyword", 200) ||
    optionalText(input, "keywords", 200) ||
    ""
  ).trim();
  const location = optionalText(input, "location", 200) || "";

  const country = (
    optionalText(input, "country", 8) || "BOTH"
  ).toUpperCase();

  if (!["US", "UK", "BOTH"].includes(country)) {
    throw new ValidationError("country must be US, UK, or BOTH.");
  }

  const category = (
    optionalText(input, "category", 16) || "BOTH"
  ).toUpperCase();

  if (!["IT", "NON-IT", "BOTH"].includes(category)) {
    throw new ValidationError("category must be IT, NON-IT, or BOTH.");
  }

  const pages = input.pages == null || input.pages === ""
    ? 60
    : Number(input.pages);

  if (!Number.isInteger(pages) || pages < 1 || pages > 100) {
    throw new ValidationError("pages must be an integer between 1 and 100.");
  }

  let searchUrl = url;

  if (!searchUrl && keyword) {
    const generatedUrl = new URL("https://www.w3global.com/search-jobs");
    generatedUrl.searchParams.set("keyword", keyword);
    generatedUrl.searchParams.set("location", location);
    searchUrl = generatedUrl.href;
  }

  if (!searchUrl) {
    throw new ValidationError("Enter a keyword or paste a search URL.");
  }

  return { url: searchUrl, country, category, keyword, location, pages };
}

function validateManualUrlImport(input = {}) {
  if (!input || typeof input !== "object" || Array.isArray(input)) {
    throw new ValidationError("A JSON object is required.");
  }

  const allowedKeys = new Set([
    "campaignId",
    "sourceUrl",
    "companyName",
    "companyWebsite",
    "jobTitle",
    "country",
    "location",
    "description",
    "skills",
    "employmentType",
    "postedAt",
    "externalId",
    "status",
  ]);

  const unknown = Object.keys(input).find((key) => !allowedKeys.has(key));
  if (unknown) throw new ValidationError(`Unknown field: ${unknown}.`);

  const sourceUrl = typeof input.sourceUrl === "string" ? input.sourceUrl.trim() : "";
  if (!sourceUrl) {
    throw new ValidationError("sourceUrl is required.");
  }
  if (sourceUrl.length > 2048) {
    throw new ValidationError("sourceUrl must be at most 2048 characters.");
  }

  let parsed;
  try {
    parsed = new URL(sourceUrl);
  } catch {
    throw new ValidationError("sourceUrl must be a valid absolute HTTP or HTTPS URL.");
  }

  if (!["http:", "https:"].includes(parsed.protocol)) {
    throw new ValidationError("sourceUrl must be a valid absolute HTTP or HTTPS URL.");
  }

  const country = typeof input.country === "string" && input.country.trim()
    ? input.country.trim().toUpperCase()
    : null;
  if (input.country !== undefined && input.country !== null && typeof input.country !== "string") {
    throw new ValidationError("country must be text.");
  }
  if (country && !["US", "UK"].includes(country)) {
    throw new ValidationError("country must be one of: US, UK.");
  }

  const jobTitle = typeof input.jobTitle === "string" ? input.jobTitle.trim() : "";
  if (!jobTitle) {
    throw new ValidationError("jobTitle is required.");
  }
  if (jobTitle.length > 200) {
    throw new ValidationError("jobTitle must be at most 200 characters.");
  }

  const companyWebsite = optionalText(input, "companyWebsite", 2048);
  if (companyWebsite) {
    let website;
    try {
      website = new URL(companyWebsite);
    } catch {
      throw new ValidationError("companyWebsite must be a valid absolute HTTP or HTTPS URL.");
    }
    if (!["http:", "https:"].includes(website.protocol)) {
      throw new ValidationError("companyWebsite must be a valid absolute HTTP or HTTPS URL.");
    }
  }

  const postedAt = optionalText(input, "postedAt", 100);
  if (postedAt && Number.isNaN(new Date(postedAt).getTime())) {
    throw new ValidationError("postedAt must be a valid date-time.");
  }

  if (input.status !== undefined && input.status !== null && typeof input.status !== "string") {
    throw new ValidationError("status must be one of: NEW, REVIEWED, LEAD_CREATED, IGNORED.");
  }
  const status = typeof input.status === "string" && input.status.trim()
    ? input.status.trim().toUpperCase()
    : "NEW";
  if (!["NEW", "REVIEWED", "LEAD_CREATED", "IGNORED"].includes(status)) {
    throw new ValidationError("status must be one of: NEW, REVIEWED, LEAD_CREATED, IGNORED.");
  }

  return {
    campaignId: typeof input.campaignId === "string" && input.campaignId.trim() ? input.campaignId.trim() : null,
    sourceUrl,
    companyName: optionalText(input, "companyName", 200),
    companyWebsite,
    jobTitle,
    country,
    location: optionalText(input, "location", 200),
    description: optionalText(input, "description", 20000),
    skills: asOptionalArray(input.skills, "skills"),
    employmentType: optionalText(input, "employmentType", 80),
    postedAt,
    externalId: optionalText(input, "externalId", 200),
    status,
  };
}

module.exports = {
  ValidationError,
  validateDiscoveryRequest,
  validateLiveDiscoveryRequest,
  validateSearchUrlRequest,
  validateSaveLiveOpportunity,
  validateFindHiringContactsRequest,
  validateManualUrlImport,
};

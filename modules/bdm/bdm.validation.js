const COUNTRIES = ["US", "UK"];
const CAMPAIGN_STATUSES = ["DRAFT", "ACTIVE", "PAUSED", "COMPLETED"];
const OPPORTUNITY_STATUSES = ["NEW", "REVIEWED", "LEAD_CREATED", "IGNORED"];

class ValidationError extends Error {
  constructor(message) {
    super(message);
    this.name = "ValidationError";
    this.statusCode = 400;
  }
}

function validateObject(input, fields, required = []) {
  if (!input || typeof input !== "object" || Array.isArray(input)) {
    throw new ValidationError("A JSON object is required.");
  }

  const allowed = new Set(Object.keys(fields));
  const unknown = Object.keys(input).find((key) => !allowed.has(key));
  if (unknown) {
    throw new ValidationError(`Unknown field: ${unknown}.`);
  }

  for (const key of required) {
    if (!Object.prototype.hasOwnProperty.call(input, key)) {
      throw new ValidationError(`${key} is required.`);
    }
  }

  const result = {};
  for (const [key, value] of Object.entries(input)) {
    result[key] = fields[key](value, key);
  }
  return result;
}

function text({ max = 500, nullable = false, required = false } = {}) {
  return (value, name) => {
    if (value === null && nullable) return null;
    if (typeof value !== "string") {
      throw new ValidationError(`${name} must be text${nullable ? " or null" : ""}.`);
    }
    const normalized = value.trim();
    if (!normalized && nullable) return null;
    if (!normalized && required) throw new ValidationError(`${name} cannot be empty.`);
    if (normalized.length > max) {
      throw new ValidationError(`${name} must be at most ${max} characters.`);
    }
    return normalized;
  };
}

function enumeration(values) {
  return (value, name) => {
    if (!values.includes(value)) {
      throw new ValidationError(`${name} must be one of: ${values.join(", ")}.`);
    }
    return value;
  };
}

function stringArray({ maxItems = 100, maxLength = 200 } = {}) {
  return (value, name) => {
    if (!Array.isArray(value) || value.length > maxItems) {
      throw new ValidationError(`${name} must be an array of at most ${maxItems} strings.`);
    }
    return value.map((item) => {
      if (typeof item !== "string" || !item.trim() || item.trim().length > maxLength) {
        throw new ValidationError(`${name} entries must be non-empty strings of at most ${maxLength} characters.`);
      }
      return item.trim();
    });
  };
}

function number({ nullable = false, integer = false, minimum = -Infinity } = {}) {
  return (value, name) => {
    if (value === null && nullable) return null;
    if (typeof value !== "number" || !Number.isFinite(value)) {
      throw new ValidationError(`${name} must be a finite number${nullable ? " or null" : ""}.`);
    }
    if ((integer && !Number.isInteger(value)) || value < minimum) {
      throw new ValidationError(`${name} must be ${integer ? "an integer" : "at least"} ${minimum} or greater.`);
    }
    return value;
  };
}

function dateTime({ nullable = false } = {}) {
  return (value, name) => {
    if (value === null && nullable) return null;
    if (typeof value !== "string" || !value.trim()) {
      throw new ValidationError(`${name} must be a valid date-time${nullable ? " or null" : ""}.`);
    }
    const date = new Date(value);
    if (Number.isNaN(date.getTime())) {
      throw new ValidationError(`${name} must be a valid date-time.`);
    }
    return date.toISOString();
  };
}

function url({ nullable = false } = {}) {
  const validateText = text({ max: 2048, nullable });
  return (value, name) => {
    const normalized = validateText(value, name);
    if (normalized === null) return null;
    let parsed;
    try {
      parsed = new URL(normalized);
    } catch {
      throw new ValidationError(`${name} must be an absolute HTTP or HTTPS URL.`);
    }
    if (!["http:", "https:"].includes(parsed.protocol)) {
      throw new ValidationError(`${name} must be an absolute HTTP or HTTPS URL.`);
    }
    return parsed.toString();
  };
}

function jsonObject(value, name) {
  if (!value || typeof value !== "object" || Array.isArray(value)) {
    throw new ValidationError(`${name} must be a JSON object.`);
  }
  return value;
}

function validateExperienceRange(data) {
  if (
    data.experienceMin !== undefined &&
    data.experienceMax !== undefined &&
    data.experienceMin !== null &&
    data.experienceMax !== null &&
    data.experienceMin > data.experienceMax
  ) {
    throw new ValidationError("experienceMin cannot be greater than experienceMax.");
  }
  return data;
}

const campaignFields = {
  name: text({ max: 160, required: true }),
  country: enumeration(COUNTRIES),
  roles: stringArray(),
  industries: stringArray(),
  locations: stringArray(),
  keywords: stringArray(),
  employmentTypes: stringArray(),
  experienceMin: number({ nullable: true, minimum: 0 }),
  experienceMax: number({ nullable: true, minimum: 0 }),
  priority: number({ integer: true, minimum: 0 }),
  status: enumeration(CAMPAIGN_STATUSES),
};

const opportunityFields = {
  campaignId: text({ max: 200, nullable: true }),
  source: enumeration(["MANUAL"]),
  externalId: text({ max: 200, nullable: true }),
  sourceUrl: url({ nullable: true }),
  companyName: text({ max: 200, nullable: true }),
  companyWebsite: url({ nullable: true }),
  jobTitle: text({ max: 200, required: true }),
  country: enumeration(COUNTRIES),
  location: text({ max: 200, nullable: true }),
  description: text({ max: 20000, nullable: true }),
  skills: stringArray(),
  employmentType: text({ max: 80, nullable: true }),
  postedAt: dateTime({ nullable: true }),
  discoveredAt: dateTime(),
  status: enumeration(OPPORTUNITY_STATUSES),
  rawData: jsonObject,
};

function validateCampaignCreate(input) {
  const data = validateObject(input, campaignFields, ["name", "country"]);
  return validateExperienceRange(data);
}

function validateCampaignPatch(input) {
  const data = validateObject(input, campaignFields);
  if (Object.keys(data).length === 0) {
    throw new ValidationError("At least one campaign field must be provided.");
  }
  return validateExperienceRange(data);
}

function validateOpportunityCreate(input) {
  return validateObject(input, opportunityFields, ["jobTitle", "country"]);
}

function validateOpportunityPatch(input) {
  const data = validateObject(input, opportunityFields);
  if (Object.keys(data).length === 0) {
    throw new ValidationError("At least one opportunity field must be provided.");
  }
  return data;
}

function validateCampaignId(value) {
  if (typeof value !== "string" || !value.trim()) {
    throw new ValidationError("campaignId must be a non-empty string.");
  }
  return value.trim();
}

module.exports = {
  ValidationError,
  validateCampaignCreate,
  validateCampaignPatch,
  validateOpportunityCreate,
  validateOpportunityPatch,
  validateCampaignId,
};

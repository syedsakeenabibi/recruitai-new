function normalizeString(value, { maxLength = 200, allowEmpty = true } = {}) {
  if (value === null || value === undefined) return null;
  const text = String(value).trim();
  if (!text) {
    return allowEmpty ? "" : null;
  }
  if (maxLength && text.length > maxLength) {
    return text.slice(0, maxLength);
  }
  return text;
}

function normalizeUrl(value) {
  if (value === null || value === undefined || value === "") return null;
  const text = String(value).trim();
  if (!text) return null;
  try {
    const parsed = new URL(text);
    if (!["http:", "https:"].includes(parsed.protocol)) return null;
    parsed.hash = "";
    parsed.pathname = parsed.pathname.replace(/\/+$/, "") || "/";
    return parsed.toString();
  } catch {
    return null;
  }
}

function preserveSourceUrl(value) {
  if (value === null || value === undefined || value === "") return null;
  const text = String(value).trim();
  if (!text) return null;
  try {
    const parsed = new URL(text);
    return ["http:", "https:"].includes(parsed.protocol) ? text : null;
  } catch {
    return null;
  }
}

function normalizeMatchText(value) {
  if (value === null || value === undefined) return "";
  return String(value).trim().replace(/\s+/g, " ").toLowerCase();
}

function normalizeCountry(value) {
  if (value === null || value === undefined || value === "") return null;

  const text = String(value).trim().toUpperCase();

  const aliases = {
    "US": "US",
    "USA": "US",
    "UNITED STATES": "US",
    "UNITED STATES OF AMERICA": "US",
    "UK": "UK",
    "GB": "UK",
    "GBR": "UK",
    "UNITED KINGDOM": "UK",
    "GREAT BRITAIN": "UK",
    "ENGLAND": "UK",
    "CANADA": "CA",
    "CA": "CA",
    "AUSTRALIA": "AU",
    "AU": "AU",
    "INDIA": "IN",
    "IN": "IN",
    "GERMANY": "DE",
    "DE": "DE",
    "FRANCE": "FR",
    "FR": "FR",
    "IRELAND": "IE",
    "IE": "IE",
    "NEW ZEALAND": "NZ",
    "NZ": "NZ",
    "SINGAPORE": "SG",
    "SG": "SG",
    "NETHERLANDS": "NL",
    "NL": "NL"
  };

  return aliases[text] || (/^[A-Z]{2}$/.test(text) ? text : null);
}

function normalizeDate(value) {
  if (value === null || value === undefined || value === "") return null;
  if (value instanceof Date && !Number.isNaN(value.getTime())) {
    return value.toISOString();
  }
  const date = new Date(value);
  return Number.isNaN(date.getTime()) ? null : date.toISOString();
}

function normalizeArray(value, { maxLength = 200 } = {}) {
  if (!Array.isArray(value)) return [];
  return value
    .filter((entry) => entry !== null && entry !== undefined && String(entry).trim() !== "")
    .map((entry) => String(entry).trim())
    .filter((entry) => entry.length > 0)
    .slice(0, maxLength);
}

function normalizeOpportunity(overrides = {}) {
  const rawData =
    overrides.rawData && typeof overrides.rawData === "object" && !Array.isArray(overrides.rawData)
      ? overrides.rawData
      : {};

  return {
    source: overrides.source || null,
    externalId: normalizeString(overrides.externalId, { maxLength: 200, allowEmpty: true }),
    sourceUrl: preserveSourceUrl(overrides.sourceUrl),
    companyName: normalizeString(overrides.companyName, { maxLength: 200, allowEmpty: true }),
    companyWebsite: normalizeUrl(overrides.companyWebsite),
    jobTitle: normalizeString(overrides.jobTitle, { maxLength: 200, allowEmpty: true }),
    country: normalizeCountry(overrides.country),
    location: normalizeString(overrides.location, { maxLength: 200, allowEmpty: true }),
    description: normalizeString(overrides.description, { maxLength: 20000, allowEmpty: true }),
    skills: normalizeArray(overrides.skills),
    employmentType: normalizeString(overrides.employmentType, { maxLength: 80, allowEmpty: true }),
    postedAt: normalizeDate(overrides.postedAt),
    discoveredAt: normalizeDate(overrides.discoveredAt) || new Date().toISOString(),
    status: overrides.status || "NEW",
    rawData,
  };
}

function createSourceAdapter({ source, normalize }) {
  if (!source) throw new TypeError("A source adapter requires a source name.");
  if (typeof normalize !== "function") {
    throw new TypeError("A source adapter requires a normalize function.");
  }

  return {
    source,
    normalize,
  };
}

module.exports = {
  createSourceAdapter,
  normalizeOpportunity,
  normalizeUrl,
  preserveSourceUrl,
  normalizeString,
  normalizeMatchText,
};

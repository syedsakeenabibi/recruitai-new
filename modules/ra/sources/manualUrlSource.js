const { createSourceAdapter, normalizeOpportunity } = require("./sourceAdapter");

function normalizeManualUrlInput(input = {}) {
  const sourceUrl = input.sourceUrl || input.url || null;
  const normalized = normalizeOpportunity({
    source: "MANUAL_URL",
    externalId: input.externalId || null,
    sourceUrl,
    companyName: input.companyName || null,
    companyWebsite: input.companyWebsite || null,
    jobTitle: input.jobTitle || null,
    country: input.country || null,
    location: input.location || null,
    description: input.description || null,
    skills: Array.isArray(input.skills) ? input.skills : [],
    employmentType: input.employmentType || null,
    postedAt: input.postedAt || null,
    discoveredAt: new Date().toISOString(),
    status: input.status || "NEW",
    rawData: {
      ...input.rawData,
      source: "MANUAL_URL",
      manualEntry: true,
      sourceUrl,
      suppliedFields: Object.keys(input || {}).filter((key) => key !== "rawData"),
    },
  });

  if (!normalized.sourceUrl) {
    const error = new Error("A valid public job URL is required for manual import.");
    error.statusCode = 400;
    throw error;
  }

  if (!normalized.jobTitle) {
    const error = new Error("jobTitle is required.");
    error.statusCode = 400;
    throw error;
  }

  return normalized;
}

const manualUrlSource = createSourceAdapter({
  source: "MANUAL_URL",
  normalize: normalizeManualUrlInput,
});

module.exports = {
  manualUrlSource,
  normalizeManualUrlInput,
  createManualUrlSource: () => manualUrlSource,
};

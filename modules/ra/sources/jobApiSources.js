
"use strict";

const { normalizeOpportunity } = require("./sourceAdapter");

const TIMEOUT_MS = 18000;

function getCountry(filters = {}) {
  const country = String(filters.country || "US").toUpperCase();

  if (["UK", "GB", "GBR", "UNITED KINGDOM"].includes(country)) {
    return "UK";
  }

  return "US";
}

function getKeywords(filters = {}) {
  const keywords = [
    filters.title,
    filters.keyword,
    filters.keywords,
  ]
    .flat()
    .filter(Boolean)
    .map(String)
    .join(" ")
    .trim();

  return keywords || "jobs";
}

async function getJson(url, options = {}) {
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), TIMEOUT_MS);

  try {
    const response = await fetch(url, {
      ...options,
      headers: {
        Accept: "application/json",
        ...(options.headers || {}),
      },
      signal: controller.signal,
    });

    if (!response.ok) {
      throw new Error(`HTTP ${response.status}`);
    }

    return await response.json();
  } finally {
    clearTimeout(timer);
  }
}

function normalizeJob(provider, item, filters) {
  let title;
  let company;
  let location;
  let url;
  let id;
  let description;
  let postedAt;

  if (provider === "JOOBLE") {
    title = item.title;
    company = item.company;
    location = item.location;
    url = item.link;
    id = item.id || item.link;
    description = item.snippet;
    postedAt = item.updated;
  }

  if (provider === "ADZUNA") {
    title = item.title;
    company = item.company?.display_name;
    location = item.location?.display_name;
    url = item.redirect_url;
    id = item.id || item.redirect_url;
    description = item.description;
    postedAt = item.created;
  }

  if (provider === "HIMALAYAS") {
    title = item.title;
    company = item.companyName;
    location = Array.isArray(item.locationRestrictions)
      ? item.locationRestrictions.join(", ")
      : (item.locationRestrictions || "Remote");
    url = item.applicationLink;
    id = item.guid || item.applicationLink;
    description = item.description || item.excerpt || "";
    postedAt = item.pubDate
      ? new Date(Number(item.pubDate) * 1000).toISOString()
      : null;
  }

  if (provider === "USAJOBS") {
    const job = item.MatchedObjectDescriptor || {};

    title = job.PositionTitle;
    company = job.OrganizationName;
    location = (job.PositionLocation || [])
      .map((place) => place.LocationName)
      .filter(Boolean)
      .join(", ");

    url = job.PositionURI || job.ApplyURI;
    id = item.MatchedObjectId || job.PositionID;
    description =
      job.UserArea?.Details?.JobSummary ||
      job.QualificationSummary ||
      "";
    postedAt = job.PublicationStartDate;
  }

  if (!title || !url || !id) {
    return null;
  }

  return normalizeOpportunity({
    source: provider,
    externalId: String(id),
    sourceUrl: url,
    companyName: company || provider,
    jobTitle: title,
    country: provider === "USAJOBS" ? "US" : getCountry(filters),
    location: location || getCountry(filters),
    description: description || "",
    postedAt: postedAt || null,
    discoveredAt: new Date().toISOString(),
    status: "NEW",
    rawData: {
      sourceProvider: provider,
      sourceAccess: "PUBLIC API",
     sourceAttribution: provider === "HIMALAYAS"
       ? "Source: Himalayas (https://himalayas.app)"
       : provider,
    },
  });
}

async function searchJooble(filters) {
  const key = process.env.JOOBLE_API_KEY;

  if (!key) {
    throw new Error("JOOBLE_API_KEY is not configured");
  }

  const country = getCountry(filters);
  const host =
    country === "UK"
      ? "https://uk.jooble.org"
      : "https://jooble.org";

  const data = await getJson(`${host}/api/${encodeURIComponent(key)}`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      keywords: getKeywords(filters),
      location: filters.location || country,
      page: "1",
      ResultOnPage: 50,
    }),
  });

  if (!Array.isArray(data.jobs)) {
    throw new Error("Jooble returned an unexpected response");
  }

  return data.jobs
    .map((job) => normalizeJob("JOOBLE", job, filters))
    .filter(Boolean);
}


async function searchAdzuna(filters) {
  const appId = process.env.ADZUNA_APP_ID;
  const appKey = process.env.ADZUNA_APP_KEY;

  if (!appId || !appKey) {
    throw new Error("ADZUNA_APP_ID and ADZUNA_APP_KEY are required");
  }

  const country = getCountry(filters);
  const countryCode = country === "UK" ? "gb" : "us";

  // Default to 2 pages (up to 100 records); allow callers to request more.
  const requestedPages = Number.parseInt(filters.pages, 10);
  const maxPages = Number.isFinite(requestedPages)
    ? Math.max(1, Math.min(requestedPages, 10))
    : 2;

  const allJobs = [];
  const seen = new Set();

  for (let page = 1; page <= maxPages; page += 1) {
    const url = new URL(
      `https://api.adzuna.com/v1/api/jobs/${countryCode}/search/${page}`
    );

    url.search = new URLSearchParams({
      app_id: appId,
      app_key: appKey,
      results_per_page: "50",
      what: getKeywords(filters),
      where: filters.location || country,
      "content-type": "application/json",
    }).toString();

    const data = await getJson(url.href);

    if (!Array.isArray(data.results)) {
      throw new Error(`Adzuna returned an unexpected response on page ${page}`);
    }

    if (data.results.length === 0) {
      break;
    }

    for (const job of data.results) {
      const key = String(job.id || job.redirect_url || "");

      if (!key || seen.has(key)) {
        continue;
      }

      seen.add(key);
      allJobs.push(job);
    }

    if (data.results.length < 50) {
      break;
    }
  }

  return allJobs
    .map((job) => normalizeJob("ADZUNA", job, filters))
    .filter(Boolean);
}


async function searchUsajobs(filters) {
  const key = process.env.USAJOBS_API_KEY;
  const email = process.env.USAJOBS_USER_AGENT;

  if (!key || !email) {
    throw new Error(
      "USAJOBS_API_KEY and USAJOBS_USER_AGENT are required"
    );
  }

  const url = new URL("https://data.usajobs.gov/api/search");

  url.search = new URLSearchParams({
    Keyword: getKeywords(filters),
    ResultsPerPage: "50",
    ...(filters.location
      ? { LocationName: filters.location }
      : {}),
  }).toString();

  const data = await getJson(url.href, {
    headers: {
      Host: "data.usajobs.gov",
      "User-Agent": email,
      "Authorization-Key": key,
    },
  });

  const jobs = data.SearchResult?.SearchResultItems;

  if (!Array.isArray(jobs)) {
    throw new Error("USAJOBS returned an unexpected response");
  }

  return jobs
    .map((job) => normalizeJob("USAJOBS", job, filters))
    .filter(Boolean);
}

async function searchHimalayas(filters = {}) {
  const country = getCountry(filters);
  const url = new URL("https://himalayas.app/jobs/api/search");

  url.searchParams.set("country", country === "UK" ? "GB" : "US");
  url.searchParams.set("sort", "recent");

  const keywords = getKeywords(filters);
  if (keywords !== "jobs") {
    url.searchParams.set("q", keywords);
  }

  const requestedPages = Number.parseInt(filters.pages, 10);
  const pages = Number.isFinite(requestedPages)
    ? Math.max(1, Math.min(requestedPages, 5))
    : 1;

  const allJobs = [];
  const seen = new Set();

  for (let page = 1; page <= pages; page += 1) {
    url.searchParams.set("page", String(page));

    const data = await getJson(url.href);

    if (!Array.isArray(data.jobs)) {
      throw new Error("Himalayas returned an unexpected response");
    }

    for (const job of data.jobs) {
      const id = String(job.guid || job.applicationLink || "");
      if (!id || seen.has(id)) continue;

      seen.add(id);
      allJobs.push(job);
    }

    if (data.jobs.length === 0) break;
  }

  return allJobs
    .map((job) => normalizeJob("HIMALAYAS", job, filters))
    .filter(Boolean);
}

const SEARCHERS = {
  JOOBLE: searchJooble,
  ADZUNA: searchAdzuna,
  HIMALAYAS: searchHimalayas,
  USAJOBS: searchUsajobs,
};

async function discoverJobApiSources(filters = {}) {
  const requested = String(filters.source || "BOTH").toUpperCase();

  const providers = Object.keys(SEARCHERS).filter(
    (provider) =>
      requested === "BOTH" ||
      requested === "ALL" ||
      requested === provider
  );

  const opportunities = [];
  const sourceStatus = [];

  await Promise.all(
    providers.map(async (provider) => {
      try {
        const jobs = await SEARCHERS[provider](filters);

        opportunities.push(...jobs);

        sourceStatus.push({
          provider,
          access: "LIVE API",
          status: "CONNECTED",
          returned: jobs.length,
        });
      } catch (error) {
        sourceStatus.push({
          provider,
          access: /not configured|required/.test(error.message)
            ? "AUTHORIZATION REQUIRED"
            : "UNAVAILABLE",
          status: "ERROR",
          returned: 0,
          error: error.message,
        });
      }
    })
  );

  return { opportunities, sourceStatus };
}

module.exports = { discoverJobApiSources };


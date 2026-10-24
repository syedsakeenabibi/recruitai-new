"use strict";

const ENDPOINT =
  "https://tpapigw.talentpathway.com/v1/job-post-svc/w3global/clientExtJob/_search";

function text(value) {
  return String(value || "")
    .replace(/<[^>]+>/g, " ")
    .replace(/&nbsp;/gi, " ")
    .replace(/&amp;/gi, "&")
    .replace(/&quot;/gi, '"')
    .replace(/\s+/g, " ")
    .trim();
}

function normalize(job) {
  const a = job.address?.[0] || {};
  const salary = job.salary || {};

  return {
    externalId: job.id || job.jobId,
    jobTitle: job.jobTitle || "",
    companyName: "W3Global",
    location: [a.city, a.state, a.country].filter(Boolean).join(", "),
    employmentType: Array.isArray(job.employmentType)
      ? job.employmentType.join(", ")
      : job.employmentType || "",
    industry: job.industry || "",
    category: job.category || "",
    description: text(job.description),
    skills: job.skills || "",
    salary: salary.min != null
      ? `${salary.currency || "USD"} ${salary.min} - ${salary.max ?? salary.min} ${salary.period || ""}`
      : "",
    sourceUrl: job.url || "",
    postedDate: job.lastUpdatedDate || "",
    source: "W3GLOBAL",
    remote: job.remote || ""
  };
}

async function fetchPage(keyword, page) {
  const form = new FormData();
  form.append("ps", "20");
  form.append("pg", String(page));
  form.append("q", keyword);
  form.append("f", "[]");
  form.append(
    "s",
    '[{"f":"postedDetails.lastUpdatedDate","d":"desc"}]'
  );

  const response = await fetch(ENDPOINT, {
    method: "POST",
    body: form,
    headers: { Accept: "application/json" },
    signal: AbortSignal.timeout(20000)
  });

  if (!response.ok) {
    throw new Error(`W3Global API HTTP ${response.status}`);
  }

  const json = await response.json();

  if (!Array.isArray(json.data)) {
    throw new Error("Unexpected W3Global response format");
  }

  return {
    jobs: json.data,
    total: Number(json.pageInfo?.total || 0)
  };
}

async function getW3GlobalJobs(searchUrl, maxPages = 60) {
  const url = new URL(searchUrl);

  if (
    url.protocol !== "https:" ||
    url.hostname !== "www.w3global.com" ||
    url.pathname !== "/search-jobs"
  ) {
    throw new Error("Invalid W3Global search URL");
  }

  const keyword = url.searchParams.get("keyword") || "";
const requestedPages = Number.isFinite(Number(maxPages))
  ? Math.floor(Number(maxPages))
  : 10;

const pagesLimit = Math.max(1, Math.min(100, requestedPages));
  const found = new Map();
  let totalAvailable = 0;
  let pagesFetched = 0;

  for (let page = 1; page <= pagesLimit; page++) {
    const result = await fetchPage(keyword, page);

    totalAvailable = result.total;
    pagesFetched++;

    for (const raw of result.jobs) {
      const job = normalize(raw);
      const key = job.externalId || job.sourceUrl;

      if (key && job.jobTitle) found.set(key, job);
    }

    console.log(
      `Page ${page}: ${result.jobs.length} received, ${found.size} unique`
    );

    if (
      result.jobs.length === 0 ||
      page * 20 >= totalAvailable
    ) break;

    if (page < pagesLimit) {
      await new Promise(resolve => setTimeout(resolve, 500));
    }
  }

  return {
    source: "W3GLOBAL",
    keyword,
    totalAvailable,
    pagesFetched,
    totalRetrieved: found.size,
    complete: found.size === totalAvailable,
    opportunities: [...found.values()]
  };
}

module.exports = { getW3GlobalJobs };

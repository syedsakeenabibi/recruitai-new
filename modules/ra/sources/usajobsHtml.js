"use strict";

const cheerio = require("cheerio");
const { normalizeOpportunity } = require("./sourceAdapter");

const BASE_URL = "https://www.usajobs.gov";
const TIMEOUT_MS = 18000;

async function fetchHtml(url) {
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), TIMEOUT_MS);

  try {
    const response = await fetch(url, {
      headers: {
        Accept: "text/html",
        "User-Agent": "RecruitAI/1.0 job-research",
      },
      signal: controller.signal,
    });

    if (!response.ok) {
      throw new Error(`USAJOBS HTML HTTP ${response.status}`);
    }

    return await response.text();
  } finally {
    clearTimeout(timer);
  }
}

function extractSalary(text) {
  const match = String(text || "").match(
    /\$\s?[\d,]+(?:\.\d{2})?\s*(?:-|–|to)\s*\$?\s?[\d,]+(?:\.\d{2})?(?:\s*(?:per hour|per year|\/hour|\/year|annually))?|\$\s?[\d,]+(?:\.\d{2})?\s*(?:per hour|per year|\/hour|\/year|annually)/i
  );
  return match ? match[0].trim() : null;
}

function extractClosingDate(text) {
  const match = String(text || "").match(
    /(?:closing date|close date|application deadline)\s*:?\s*([A-Z][a-z]+\s+\d{1,2},?\s+\d{4}|\d{1,2}\/\d{1,2}\/\d{4})/i
  );
  return match ? match[1] : null;
}

async function searchUsajobsHtml(filters = {}) {
  const url = new URL("/Search/Results", BASE_URL);

  const keyword = [
    filters.title,
    filters.keyword,
    ...(Array.isArray(filters.keywords)
      ? filters.keywords
      : [filters.keywords]),
  ].filter(Boolean).join(" ").trim();

  if (keyword) url.searchParams.set("j", keyword);
  if (filters.location) url.searchParams.set("l", filters.location);

  const requestedPages = Number.parseInt(filters.pages, 10);
  const maxPages = Number.isFinite(requestedPages)
    ? Math.max(1, Math.min(requestedPages, 5))
    : 1;

  const results = [];
  const seen = new Set();

  for (let page = 1; page <= maxPages; page += 1) {
    const pageUrl = new URL(url);
    if (page > 1) pageUrl.searchParams.set("p", String(page));

    const html = await fetchHtml(pageUrl.href);
    const $ = cheerio.load(html);

    const links = $('a[href*="/job/"]');

    links.each((_, element) => {
      const anchor = $(element);
      const title = anchor.text().replace(/\s+/g, " ").trim();
      const href = anchor.attr("href");

      if (!title || !href) return;

      let jobUrl;
      try {
        jobUrl = new URL(href, BASE_URL);
      } catch {
        return;
      }

      if (
        jobUrl.hostname !== "www.usajobs.gov" ||
        !/^\/job\/\d+\/?$/i.test(jobUrl.pathname)
      ) return;

      const id = jobUrl.pathname.match(/\/job\/(\d+)/i)?.[1];
      if (!id || seen.has(id)) return;

      let card = anchor;
      for (let i = 0; i < 6; i += 1) {
        if (!card.parent().length) break;
        card = card.parent();

        const text = card.text().replace(/\s+/g, " ").trim();
        if (text.length > title.length + 20 && text.length < 12000) {
          break;
        }
      }

      const cardText = card.text().replace(/\s+/g, " ").trim();
      if (!cardText) return;

      seen.add(id);

      results.push({
        id,
        title,
        url: jobUrl.href,
        summary: cardText.slice(0, 5000),
        salary: extractSalary(cardText),
        closingDate: extractClosingDate(cardText),
      });
    });

    if (links.length === 0) break;
  }

  return results.map((job) => {
    const normalized = normalizeOpportunity({
      source: "USAJOBS",
      externalId: job.id,
      sourceUrl: job.url,
      companyName: "USAJOBS listing — verify agency",
      jobTitle: job.title,
      country: "US",
      location: filters.location || "United States",
      description: job.summary,
      discoveredAt: new Date().toISOString(),
      status: "NEW",
      rawData: {
        sourceProvider: "USAJOBS",
        sourceAccess: "PUBLIC HTML",
        salaryText: job.salary,
        closingDate: job.closingDate,
      },
    });

    return {
      ...normalized,
      salaryText: job.salary,
      closingDate: job.closingDate,
      sourceAccess: "PUBLIC HTML",
    };
  });
}

module.exports = {
  searchUsajobsHtml,
  extractSalary,
  extractClosingDate,
};

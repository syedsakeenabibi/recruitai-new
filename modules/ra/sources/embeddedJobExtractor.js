"use strict";

function extractEmbeddedJobs(html, baseUrl) {
  const results = new Map();
  const visited = new WeakSet();
  let inspected = 0;
  const MAX_NODES = 50000;

  function inspect(value, depth = 0) {
    if (depth > 25 || ++inspected > MAX_NODES) return;

    if (typeof value === "string") {
      const trimmed = value.trim();

      if (
        trimmed.length > 2 &&
        trimmed.length < 2000000 &&
        (trimmed.startsWith("{") || trimmed.startsWith("["))
      ) {
        try {
          inspect(JSON.parse(trimmed), depth + 1);
        } catch {}
      }
      return;
    }

    if (!value || typeof value !== "object") return;
    if (visited.has(value)) return;
    visited.add(value);

    if (Array.isArray(value)) {
      for (const item of value) inspect(item, depth + 1);
      return;
    }

    const title = value.title || value.job_title;
    const rawUrl = value.absolute_url || value.job_url || value.apply_url;

    if (
      typeof title === "string" &&
      typeof rawUrl === "string" &&
      (value.internal_job_id || value.requisition_id ||
       value.departments || value.location || value.id)
    ) {
      try {
        const url = new URL(rawUrl, baseUrl);

        if (url.protocol === "https:") {
          const location =
            typeof value.location === "string"
              ? value.location
              : value.location?.name || "";

          results.set(url.href, {
            title: title.trim(),
            company: value.company_name || "",
            location,
            sourceUrl: url.href,
            externalJobId: String(
              value.id || value.internal_job_id || ""
            ),
            employmentType:
              value.metadata?.find?.(
                m => m.name === "Employment Type"
              )?.value || "",
            description:
              typeof value.content === "string"
                ? value.content
                : typeof value.description === "string"
                  ? value.description
                  : "",
            sourceProvider: "EMBEDDED_JSON"
          });
        }
      } catch {}
    }

    for (const child of Object.values(value)) {
      inspect(child, depth + 1);
      if (inspected > MAX_NODES) break;
    }
  }

  const scripts = html.matchAll(
    /<script\b[^>]*type=["']application\/json["'][^>]*>([\s\S]*?)<\/script>/gi
  );

  for (const match of scripts) {
    try {
      inspect(JSON.parse(match[1]));
    } catch {}
  }

  const nextData = html.match(
    /<script[^>]*id=["']__NEXT_DATA__["'][^>]*>([\s\S]*?)<\/script>/i
  );

  if (nextData) {
    try {
      inspect(JSON.parse(nextData[1]));
    } catch {}
  }

  return [...results.values()];
}

module.exports = { extractEmbeddedJobs };

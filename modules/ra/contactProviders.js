"use strict";

const BUSINESS_EMAIL = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
const PERSONAL_DOMAINS = new Set([
  "gmail.com", "yahoo.com", "hotmail.com",
  "outlook.com", "icloud.com", "proton.me"
]);

function normalizeContact(input, sourceProvider) {
  if (!input || typeof input !== "object") return null;

  const email = String(input.email || "").trim().toLowerCase();
  const domain = email.split("@")[1];

  if (!BUSINESS_EMAIL.test(email) || PERSONAL_DOMAINS.has(domain)) {
    return null;
  }

  return {
    contactName: String(input.contactName || "").trim() || null,
    contactTitle: String(input.contactTitle || "").trim() || null,
    contactType: "EMPLOYER_CONTACT",
    email,
    phone: input.phone || null,
    professionalProfileUrl: input.professionalProfileUrl || null,
    sourceProvider,
    verificationStatus: input.verificationStatus === "valid" ? "VERIFIED" : "UNVERIFIED",
    checkedAt: new Date().toISOString()
  };
}

async function verifyEmployerEmail(email) {
  const apiKey = process.env.HUNTER_API_KEY;

  if (!apiKey || !email) {
    return {
      status: "UNKNOWN",
      email,
      reason: "Hunter API key or email missing",
      checkedAt: new Date().toISOString()
    };
  }

  const url = new URL("https://api.hunter.io/v2/email-verifier");
  url.searchParams.set("email", email);
  url.searchParams.set("api_key", apiKey);

  const statusMap = {
    valid: "VERIFIED",
    invalid: "INVALID",
    accept_all: "CATCH_ALL",
    webmail: "WEBMAIL",
    disposable: "DISPOSABLE",
    unknown: "UNKNOWN"
  };

  for (let attempt = 0; attempt < 6; attempt++) {
    const response = await fetch(url, {
      signal: AbortSignal.timeout(25000)
    });

    const payload = await response.json().catch(() => ({}));

    if (response.status === 202) {
      if (attempt < 5) {
        await new Promise(resolve => setTimeout(resolve, 5000));
        continue;
      }

      return {
        status: "UNKNOWN",
        email,
        reason: "Hunter verification is still processing after six attempts",
        checkedAt: new Date().toISOString()
      };
    }

    if (response.status === 222) {
      return {
        status: "UNKNOWN",
        email,
        reason: "Hunter received an unexpected SMTP response; retry later",
        checkedAt: new Date().toISOString(),
        httpStatus: 222
      };
    }

    if (!response.ok) {
      return {
        status: "UNKNOWN",
        email,
        reason: payload.errors?.[0]?.details || `Hunter HTTP ${response.status}`,
        checkedAt: new Date().toISOString(),
        httpStatus: response.status
      };
    }

    const result = payload.data || {};
    const rawStatus = String(result.status || "").toLowerCase();

    return {
      status: statusMap[rawStatus] || "UNKNOWN",
      result: rawStatus,
      email: result.email || email,
      score: result.score ?? null,
      regexp: result.regexp ?? null,
      gibberish: result.gibberish ?? null,
      disposable: result.disposable ?? null,
      webmail: result.webmail ?? null,
      mxRecords: result.mx_records ?? null,
      smtpServer: result.smtp_server ?? null,
      smtpCheck: result.smtp_check ?? null,
      acceptAll: result.accept_all ?? null,
      block: result.block ?? null,
      verification: result.verification ?? null,
      sources: result.sources ?? [],
      checkedAt: new Date().toISOString()
    };
  }
}
async function verifyEmployerContacts(contacts) {
  const results = [];
  const maxRetries = 2;

  for (const contact of contacts || []) {
    if (!contact.email) {
      results.push({
        ...contact,
        verificationStatus: "UNKNOWN"
      });
      continue;
    }

    let verification = null;
    let attempts = 0;

    for (let attempt = 0; attempt <= maxRetries; attempt++) {
      attempts++;

      try {
        verification = await verifyEmployerEmail(contact.email);
      } catch (error) {
        verification = {
          status: "UNKNOWN",
          email: contact.email,
          reason: error.message || "Hunter verification failed",
          checkedAt: new Date().toISOString()
        };
      }

      if (verification.status !== "UNKNOWN") break;

      const httpStatus = Number(verification.httpStatus || 0);
      const reason = String(verification.reason || "");

      const temporaryFailure =
        httpStatus === 222 ||
        httpStatus === 429 ||
        httpStatus >= 500 ||
        /network|timeout|aborted|processing after six attempts|fetch failed|socket|ECONNRESET|ETIMEDOUT/i.test(reason);

      if (!temporaryFailure || attempt === maxRetries) break;

      await new Promise(resolve =>
        setTimeout(resolve, 3000 * (attempt + 1))
      );
    }

    results.push({
      ...contact,
      verificationStatus: verification.status,
      emailVerification: {
        ...verification,
        attempts
      },
      ...(verification.status === "UNKNOWN"
        ? { verificationError: verification.reason || "Verification inconclusive" }
        : {})
    });
  }

  return results;
}
async function discoverEmployerContacts({ companyName, jobTitle, location, companyDomain }) {
  if (!companyName || !jobTitle) return [];

  const apiKey = process.env.HUNTER_API_KEY;
if (!apiKey) return [];

  const domain = String(companyDomain || "").trim().toLowerCase();

 if (companyDomain && !/^[a-z0-9-]+(\.[a-z0-9-]+)+$/.test(domain)) {
  return [];
}

  const url = new URL("https://api.hunter.io/v2/domain-search");
if (companyDomain) {
  url.searchParams.set("domain", domain);
} else {
  url.searchParams.set("company", companyName);
}
  url.searchParams.set("limit", "10");
  url.searchParams.set("department", "hr");

  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), 10000);

  try {
    const response = await fetch(url, {
      headers: { Authorization: `Bearer ${apiKey}` },
      signal: controller.signal
    });

    if (!response.ok) {
      const details = await response.json().catch(() => ({})); const reason = details.errors?.map(e => e.details || e.id).join(", ") || details.message || "No error details provided"; throw new Error(`Hunter HTTP ${response.status}: ${reason}`);
    }

    let payload = await response.json();

    // If HR search returns no contacts, use the original general search.
    if (!Array.isArray(payload?.data?.emails) || payload.data.emails.length === 0) {
      const fallbackUrl = new URL(url);
      fallbackUrl.searchParams.delete("department");
      const fallbackResponse = await fetch(fallbackUrl, {
        headers: { Authorization: `Bearer ${apiKey}` },
        signal: controller.signal
      });
      if (!fallbackResponse.ok) {
        throw new Error(`Hunter fallback HTTP ${fallbackResponse.status}`);
      }
      payload = await fallbackResponse.json();
    }
    const emails = Array.isArray(payload?.data?.emails)
      ? payload.data.emails
      : [];

    return emails
      .filter(item => {
        const title = String(item.position || "").toLowerCase();
        const department = String(item.department || "").toLowerCase();
        const job = String(jobTitle || "").toLowerCase();
        const hiring = /recruit|talent|hiring|human resources|people operations|staffing|hr\b/.test(title + " " + department);
        const tech = /software|engineer|developer|data|cloud|devops|security|technical|it\b/.test(job);
        const finance = /finance|account|payroll|banking|payment/.test(job);
        const operations = /warehouse|construction|labor|logistics|operations|manufactur|production/.test(job);
        const relevant = (tech && /engineering|technology|software|it\b|technical/.test(title + " " + department))
          || (finance && /finance|accounting|financial/.test(title + " " + department))
          || (operations && /operations|construction|logistics|production|manufactur/.test(title + " " + department));
        return hiring || relevant || /manager|director|head|vice president|vp\b|chief|supervisor|lead\b/i.test(title);
      })
      .sort((a, b) => {
        const hiringPriority = item => {
          const title = String(item.position || "").toLowerCase();
          const dept = String(item.department || "").toLowerCase();
          const combined = title + " " + dept;
          const job = String(jobTitle || "").toLowerCase();
          const recruiter = /talent acquisition|recruit|staffing|hiring|human resources|people operations|people partner|hr\b/.test(combined);
          const tech = /software|engineer|developer|data|cloud|devops|security|technical|it\b/.test(job);
          const finance = /finance|account|payroll|banking|payment/.test(job);
          const operations = /warehouse|construction|labor|logistics|operations|manufactur|production/.test(job);
          const relevant = (tech && /engineering|technology|software|technical|it\b/.test(combined))
            || (finance && /finance|accounting|financial/.test(combined))
            || (operations && /operations|construction|logistics|production|manufactur/.test(combined));
          const management = /manager|director|head|vice president|vp\b|chief|supervisor|lead\b/.test(title);
          const tier = recruiter ? 3 : relevant ? 2 : management ? 1 : 0;
          return tier * 100
            + (management ? 10 : 0)
            + (item.first_name && item.last_name ? 2 : 0)
            + (item.verification?.status === "valid" ? 1 : 0);
        };
        return hiringPriority(b) - hiringPriority(a);
      })      .map(item => {
        const title = String(item.position || "").toLowerCase();
        const dept = String(item.department || "").toLowerCase();
        const combined = title + " " + dept;
        const job = String(jobTitle || "").toLowerCase();
        const recruiter = /talent acquisition|recruit|staffing|hiring|human resources|people operations|people partner|hr\b/.test(combined);
        const tech = /software|engineer|developer|data|cloud|devops|security|technical|it\b/.test(job);
        const finance = /finance|account|payroll|banking|payment/.test(job);
        const operations = /warehouse|construction|labor|logistics|operations|manufactur|production/.test(job);
        const relevant = (tech && /engineering|technology|software|technical|it\b/.test(combined))
          || (finance && /finance|accounting|financial/.test(combined))
          || (operations && /operations|construction|logistics|production|manufactur/.test(combined));
        const normalized = normalizeContact({
        contactName: [item.first_name, item.last_name].filter(Boolean).join(" "),
        contactTitle: item.position,
        email: item.value,
        phone: item.phone_number || null,
        verificationStatus: item.verification?.status || "unknown"
          }, "HUNTER");
        if (!normalized) return null;
        return {
          ...normalized,
          contactPriority: recruiter ? 1 : relevant ? 2 : 3,
          contactPriorityLabel: recruiter ? "Recruiter / Talent Acquisition / HR" : relevant ? "Relevant Department Contact" : "Other Management Contact"
        };
      })
      .filter(Boolean);

  } finally {
    clearTimeout(timeout);
  }
}


async function discoverApifyDecisionMakers({ companyWebsite, maxLeads = 5 }) {
  const token = process.env.APIFY_TOKEN;
  if (!token || !companyWebsite) return [];

  let website;
  try {
    website = /^https?:\/\//i.test(companyWebsite)
      ? companyWebsite
      : `https://${companyWebsite}`;
    website = new URL(website).origin + new URL(website).pathname;
  } catch {
    return [];
  }

  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), 180000);

  try {
    const response = await fetch(
      "https://api.apify.com/v2/acts/vdrmota~contact-info-scraper/run-sync-get-dataset-items",
      {
        method: "POST",
        headers: {
          Authorization: `Bearer ${token}`,
          "Content-Type": "application/json"
        },
        signal: controller.signal,
        body: JSON.stringify({
          considerChildFrames: true,
          leadsEnrichmentDepartments: ["human_resources", "operations"],
          maxDepth: 2,
          maxRequests: 25,
          maxRequestsPerStartUrl: 5,
          maximumLeadsEnrichmentRecords: Math.max(1, Math.min(5, maxLeads)),
          mergeContacts: true,
          sameDomain: true,
          scrapeSocialMediaProfiles: {
            facebooks: false,
            instagrams: false,
            tiktoks: false,
            twitters: false,
            youtubes: false
          },
          startUrls: [{ url: website }],
          useBrowser: false,
          verifyLeadsEnrichmentEmails: false,
          waitUntil: "domcontentloaded",
          proxyConfig: { useApifyProxy: true }
        })
      }
    );

    if (!response.ok) {
      const details = await response.text().catch(() => "");
      throw new Error(`Apify HTTP ${response.status}: ${details.slice(0, 500)}`);
    }

    const payload = await response.json();
    const items = Array.isArray(payload) ? payload : [];
    const leads = items.flatMap(item =>
      Array.isArray(item.leadsEnrichment) ? item.leadsEnrichment : []
    );

    const seen = new Set();

    return leads.map(item => {
      const normalized = normalizeContact({
        contactName: item.fullName ||
          [item.firstName, item.lastName].filter(Boolean).join(" "),
        contactTitle: item.jobTitle,
        email: item.email,
        phone: item.mobileNumber || null,
        professionalProfileUrl: item.linkedinProfile || null,
        verificationStatus: "unknown"
      }, "APIFY_CONTACT_INFO");

      if (!normalized) return null;

      const key = normalized.email.toLowerCase();
      if (seen.has(key)) return null;
      seen.add(key);

      const title = String(item.jobTitle || "").toLowerCase();
      const recruiter = /recruit|talent acquisition|human resources|people operations|staffing|\bhr\b/.test(title);
      const operations = /operations|property|facilities|construction|logistics|warehouse|production/.test(title);
      const management = /manager|director|head|chief|president|vice president|supervisor/.test(title);

      return {
        ...normalized,
        contactPriority: recruiter ? 1 : operations ? 2 : management ? 2 : 3,
        contactPriorityLabel: recruiter
          ? "Recruiter / Talent Acquisition / HR"
          : operations
            ? "Operations Contact"
            : management
              ? "Management Contact"
              : "Other Employer Contact"
      };
    }).filter(Boolean);

  } finally {
    clearTimeout(timeout);
  }
}
module.exports = {
  normalizeContact,
  discoverEmployerContacts,
  verifyEmployerEmail,
  verifyEmployerContacts,
  discoverApifyDecisionMakers
};







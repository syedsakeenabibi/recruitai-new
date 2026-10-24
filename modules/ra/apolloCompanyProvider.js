"use strict";

async function lookupApolloCompany(companyName) {
  const apiKey = process.env.APOLLO_API_KEY;
  if (!apiKey || !companyName) return null;

  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), 10000);

  try {
    const response = await fetch("https://api.apollo.io/api/v1/organizations/search", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "X-Api-Key": apiKey
      },
      body: JSON.stringify({
        q_organization_name: companyName,
        page: 1,
        per_page: 5
      }),
      signal: controller.signal
    });

    if (!response.ok) {
      console.error("Apollo company lookup HTTP", response.status);
      return null;
    }

    const data = await response.json();
    const companies = Array.isArray(data.organizations) ? data.organizations : [];
    const wanted = companyName.trim().toLowerCase();

    const company = companies.find((item) =>
      String(item.name || "").trim().toLowerCase() === wanted
    );

    if (!company) return null;

    return {
      companyName: company.name || null,
      website: company.website_url || null,
      domain: company.primary_domain || null,
      industry: company.industry || null,
      employeeCount: company.estimated_num_employees ?? null,
      sourceProvider: "APOLLO",
      checkedAt: new Date().toISOString()
    };
  } catch (error) {
    console.error("Apollo company lookup failed:", error.message);
    return null;
  } finally {
    clearTimeout(timeout);
  }
}

module.exports = { lookupApolloCompany };

const assert = require("node:assert/strict");
const test = require("node:test");
const { createRaService } = require("./ra.service");

test("live discovery applies saved campaign targeting and merges optional keywords", async () => {
  const campaign = {
    id: "campaign-1",
    country: "US",
    roles: ["Medical Representative", "Healthcare Sales Representative"],
    industries: ["Healthcare", "Pharmaceutical"],
    locations: ["New York", "New Jersey"],
    keywords: ["pharmaceutical sales", "healthcare sales"],
    employmentTypes: ["Full-time"],
    experienceMin: 2,
    experienceMax: 5,
  };
  const db = {
    async query(query, values) {
      assert.match(query, /FROM "BDMCampaign"/);
      assert.deepEqual(values, [campaign.id]);
      return { rows: [campaign] };
    },
  };
  const originalFetch = global.fetch;
  const requestedUrls = [];
  global.fetch = async (url) => {
    requestedUrls.push(String(url));
    return new Response(JSON.stringify({
      jobs: [{
        id: 123,
        title: "Healthcare Sales Representative",
        absolute_url: "https://boards.greenhouse.io/example/jobs/123",
        company_name: "Example Health",
        location: { name: "Newark, NJ" },
        content: "Work with pharmaceutical clients in healthcare sales.",
        metadata: [{ name: "Employment Type", value: "Full-time" }],
      }],
    }), {
      status: 200,
      headers: { "content-type": "application/json" },
    });
  };

  try {
    const result = await createRaService(db).discoverLiveOpportunities({
      campaignId: campaign.id,
      country: "UK",
      category: "BOTH",
      source: "GREENHOUSE",
      title: "",
      keywords: ["managed care"],
      boards: [{ provider: "GREENHOUSE", slug: "example" }],
      onlyRequestedBoards: true,
    });

    assert.deepEqual(requestedUrls, [
      "https://boards-api.greenhouse.io/v1/boards/example/jobs?content=true",
    ]);
    assert.equal(result.sourceStatus, "LIVE_API");
    assert.equal(result.opportunities.length, 1);
    assert.equal(result.opportunities[0].jobTitle, "Healthcare Sales Representative");
    assert.equal(result.opportunities[0].sourceUrl, "https://boards.greenhouse.io/example/jobs/123");
    assert.deepEqual(result.effectiveTargeting, {
      country: "US",
      roles: campaign.roles,
      industries: campaign.industries,
      locations: campaign.locations,
      employmentTypes: campaign.employmentTypes,
      experienceMin: 2,
      experienceMax: 5,
      category: "BOTH",
      title: "",
      keywords: ["pharmaceutical sales", "healthcare sales", "managed care"],
      company: undefined,
      location: undefined,
      source: "GREENHOUSE",
      after: undefined,
      before: undefined,
    });
  } finally {
    global.fetch = originalFetch;
  }
});

test("live discovery reports failed provider connections without treating them as empty matches", async () => {
  const originalFetch = global.fetch;
  global.fetch = async () => {
    throw new Error("Network unavailable");
  };

  try {
    const result = await createRaService({ query: async () => ({ rows: [] }) })
      .discoverLiveOpportunities({
        country: "US",
        source: "ALL",
        boards: [
          { provider: "GREENHOUSE", slug: "example-gh" },
          { provider: "LEVER", slug: "example-lever" },
          { provider: "ASHBY", slug: "example-ashby" },
          { provider: "SMARTRECRUITERS", slug: "ExampleSR" },
        ],
        onlyRequestedBoards: true,
      });

    assert.equal(result.sourceStatus, "UNAVAILABLE");
    assert.equal(result.opportunities.length, 0);
    assert.equal(result.providerStatus.length, 4);
    assert.ok(result.providerStatus.every((status) => status.status === "ERROR"));
    assert.ok(result.providerStatus.every((status) => status.error.includes("Network unavailable")));
  } finally {
    global.fetch = originalFetch;
  }
});

test("contact lookup re-verifies the saved employer vacancy and returns only a published channel", async () => {
  const opportunity = {
    id: "opportunity-1",
    companyName: "Example Health",
    sourceUrl: "https://boards.greenhouse.io/example/jobs/123",
    externalId: "123",
    rawData: {
      sourceProvider: "GREENHOUSE",
      sourceBoard: "example",
      sourceProviderJobId: "123",
    },
  };
  const db = {
    async query(query, values) {
      assert.match(query, /FROM "JobOpportunity"/);
      assert.deepEqual(values, [opportunity.id]);
      return { rows: [opportunity] };
    },
  };
  const originalFetch = global.fetch;
  global.fetch = async () => new Response(JSON.stringify({
    jobs: [{
      id: 123,
      title: "Manufacturing Technician",
      absolute_url: opportunity.sourceUrl,
      company_name: opportunity.companyName,
      location: { name: "New York, NY" },
      content: "For recruiting questions, email hiring@examplehealth.com to apply.",
    }],
  }), {
    status: 200,
    headers: { "content-type": "application/json" },
  });

  try {
    const result = await createRaService(db).findHiringContacts(opportunity.id);
    assert.equal(result.lookupStatus, "VERIFIED_RECRUITMENT_CHANNEL");
    assert.equal(result.sourceStatus, "CONNECTED");
    assert.equal(result.contacts.length, 0);
    assert.equal(result.channels[0].email, "hiring@examplehealth.com");
    assert.equal(result.channels[0].evidenceUrl, opportunity.sourceUrl);
    assert.equal(result.channels[0].contactName, null);
  } finally {
    global.fetch = originalFetch;
  }
});

test("contact lookup gives an honest no-result for unsupported vacancy sources", async () => {
  const opportunity = {
    id: "manual-opportunity",
    companyName: "Example Company",
    sourceUrl: "https://careers.example.com/jobs/1",
    externalId: null,
    rawData: {},
  };
  const db = { query: async () => ({ rows: [opportunity] }) };
  const result = await createRaService(db).findHiringContacts(opportunity.id);
  assert.equal(result.lookupStatus, "NOT_FOUND");
  assert.equal(result.sourceStatus, "NO_SUPPORTED_LIVE_SOURCE");
  assert.match(result.message, /No verified hiring contact found/);
  assert.deepEqual(result.channels, []);
});

const assert = require("node:assert/strict");
const test = require("node:test");
const {
  classifyCategory,
  DEFAULT_BOARDS,
  discoverAtsJobs,
  inferCountry,
  matchesFilters,
  normalizeProviderJob,
  searchFromUrl,
  validatePublicSearchUrl,
} = require("./atsSources");

test("country inference excludes worldwide remote jobs without US/UK evidence", () => {
  assert.equal(inferCountry(null, "Remote - Worldwide"), null);
  assert.equal(inferCountry(null, "Remote - United States"), "US");
  assert.equal(inferCountry(null, "London, United Kingdom"), "UK");
});

test("category classification leaves unsupported titles unclassified", () => {
  assert.equal(classifyCategory("Senior Software Engineer"), "IT");
  assert.equal(classifyCategory("Healthcare Sales Representative"), "Non-IT");
  assert.equal(classifyCategory("AI Solutions Lead, Marketing"), "Both");
  assert.equal(classifyCategory("Senior Associate"), "Unclassified");
});

test("sales roles mentioning AI are not classified as IT unless the role is technical", () => {
  assert.equal(classifyCategory("Account Executive, AI Sales"), "Non-IT");
  assert.equal(classifyCategory("AI Engineer"), "IT");
});

test("Ashby secondary location objects normalize without fabricated object text", () => {
  const opportunity = normalizeProviderJob("ASHBY", "openai", "OpenAI", {
    jobId: "job-123",
    title: "Software Engineer",
    jobUrl: "https://jobs.ashbyhq.com/openai/job-123",
    location: "San Francisco",
    address: {
      postalAddress: {
        addressCountry: "United States",
        addressLocality: "San Francisco",
        addressRegion: "California",
      },
    },
    secondaryLocations: [{
      location: "London, UK",
      address: {
        postalAddress: {
          addressCountry: "United Kingdom",
          addressLocality: "London",
        },
      },
    }],
  });

  assert.equal(opportunity.country, "US");
  assert.equal(opportunity.location, "San Francisco, London, UK");
  assert.doesNotMatch(opportunity.location, /\[object Object\]/);
  assert.equal(opportunity.city, "San Francisco");
});

test("remote country-wide listings do not claim the country name as a city", () => {
  const opportunity = normalizeProviderJob("ASHBY", "openai", "OpenAI", {
    jobId: "job-456",
    title: "Software Engineer",
    jobUrl: "https://jobs.ashbyhq.com/openai/job-456",
    location: "United States - Remote",
    address: { postalAddress: { addressCountry: "United States" } },
  });

  assert.equal(opportunity.country, "US");
  assert.equal(opportunity.city, null);
  assert.equal(opportunity.location, "United States - Remote");
});

test("SmartRecruiters postings normalize provider location, type, and canonical employer URL", () => {
  const opportunity = normalizeProviderJob("SMARTRECRUITERS", "Experian", "Experian", {
    id: "744000154113830",
    name: "Optimisation Manager - Growth",
    company: { identifier: "Experian", name: "Experian" },
    location: {
      city: "London",
      region: "England",
      country: "gb",
      fullLocation: "London, England, United Kingdom",
    },
    releasedDate: "2026-10-08T05:48:45.719Z",
    typeOfEmployment: { label: "Full-time" },
  });

  assert.equal(opportunity.country, "UK");
  assert.equal(opportunity.city, "London");
  assert.equal(opportunity.employmentType, "Full-time");
  assert.equal(opportunity.postedAt, "2026-10-08T05:48:45.719Z");
  assert.equal(opportunity.sourceUrl, "https://jobs.smartrecruiters.com/Experian/744000154113830-optimisation-manager-growth");
});

test("Indeed and LinkedIn URLs resolve as authorization-required filters, not imported vacancies", () => {
  const indeed = validatePublicSearchUrl("https://uk.indeed.com/jobs?q=software+engineer&l=London%2C+United+Kingdom");
  assert.equal(indeed.provider, "INDEED");
  assert.equal(indeed.access, "AUTHORIZATION REQUIRED");
  assert.equal(indeed.country, "UK");
  assert.equal(indeed.keywords, "software engineer");
  assert.equal(indeed.location, "London, United Kingdom");

  const linkedin = validatePublicSearchUrl("https://www.linkedin.com/jobs/search/?keywords=nurse&location=United%20States");
  assert.equal(linkedin.provider, "LINKEDIN");
  assert.equal(linkedin.country, "US");
  assert.equal(linkedin.keywords, "nurse");

  const indeedUk = validatePublicSearchUrl("https://www.indeed.co.uk/jobs?q=warehouse&l=Manchester");
  assert.equal(indeedUk.provider, "INDEED");
  assert.equal(indeedUk.access, "AUTHORIZATION REQUIRED");
  assert.equal(indeedUk.country, "UK");
});

test("public ATS job board URLs resolve provider identifiers", () => {
  const greenhouse = validatePublicSearchUrl("https://job-boards.greenhouse.io/instacart/jobs/7144697");
  assert.equal(greenhouse.provider, "GREENHOUSE");
  assert.equal(greenhouse.board, "instacart");
  assert.equal(greenhouse.externalId, "7144697");
  assert.equal(greenhouse.isIndividualJob, true);

  const smartRecruiters = validatePublicSearchUrl("https://jobs.smartrecruiters.com/Experian");
  assert.equal(smartRecruiters.provider, "SMARTRECRUITERS");
  assert.equal(smartRecruiters.board, "Experian");

  const lever = validatePublicSearchUrl("https://jobs.lever.co/spotify/926149ab-6999-4058-b35d-41e302b70e05");
  assert.equal(lever.provider, "LEVER");
  assert.equal(lever.board, "spotify");
  assert.equal(lever.externalId, "926149ab-6999-4058-b35d-41e302b70e05");
  assert.equal(lever.isIndividualJob, true);

  const ashby = validatePublicSearchUrl("https://jobs.ashbyhq.com/ramp/34413f8d-26bf-4bbc-8ade-eb309a0e2245");
  assert.equal(ashby.provider, "ASHBY");
  assert.equal(ashby.board, "ramp");
  assert.equal(ashby.externalId, "34413f8d-26bf-4bbc-8ade-eb309a0e2245");
});

test("restricted job portals retain manual URLs and parse search filters", () => {
  const dice = validatePublicSearchUrl("https://www.dice.com/jobs?q=cloud+engineer&location=New+York");
  assert.equal(dice.provider, "DICE");
  assert.equal(dice.access, "AUTHORIZATION REQUIRED");
  assert.equal(dice.country, "US");
  assert.equal(dice.keywords, "cloud engineer");

  const reed = validatePublicSearchUrl("https://www.reed.co.uk/jobs/nurse/52962253");
  assert.equal(reed.provider, "REED");
  assert.equal(reed.access, "AUTHORIZATION REQUIRED");
  assert.equal(reed.country, "UK");
  assert.equal(reed.isIndividualJob, true);

  const totaljobs = validatePublicSearchUrl("https://www.totaljobs.com/jobs?keywords=warehouse&location=Manchester");
  assert.equal(totaljobs.provider, "TOTALJOBS");
  assert.equal(totaljobs.country, "UK");
  assert.equal(totaljobs.keywords, "warehouse");

  const glassdoor = validatePublicSearchUrl("https://www.glassdoor.co.uk/Job/london-nurse-jobs-SRCH.htm");
  assert.equal(glassdoor.provider, "GLASSDOOR");
  assert.equal(glassdoor.country, "UK");

  const zipRecruiter = validatePublicSearchUrl("https://www.ziprecruiter.com/jobs-search?search=driver&location=London%2C+UK");
  assert.equal(zipRecruiter.provider, "ZIPRECRUITER");
  assert.equal(zipRecruiter.country, "UK");

  const directCareers = validatePublicSearchUrl("https://careers.example.org/jobs?q=accountant");
  assert.equal(directCareers.provider, "DIRECT_CAREERS");
  assert.equal(directCareers.access, "MANUAL LINK");
  assert.equal(directCareers.keywords, "accountant");
});

test("URL resolver rejects local/private destinations and custom ports", () => {
  for (const url of [
    "http://127.0.0.1:4000/admin",
    "http://localhost/jobs",
    "https://example.com:8443/jobs",
    "file:///C:/private/file",
  ]) {
    assert.throws(() => validatePublicSearchUrl(url));
  }
});

test("campaign roles and locations use OR matching and keep unclassified BOTH results", () => {
  assert.equal(matchesFilters({
    jobTitle: "Sales Development Representative, Mid-Market",
    category: "Non-IT",
    location: "New York, NY",
  }, {
    category: "BOTH",
    roles: ["Healthcare Sales Representative"],
  }), false);

  assert.equal(matchesFilters({
    jobTitle: "Medical Sales Rep",
    category: "Non-IT",
    location: "New York, NY",
  }, {
    category: "BOTH",
    roles: ["Medical Representative", "Healthcare Sales Representative"],
  }), true);

  const job = {
    jobTitle: "Healthcare Sales Representative",
    category: "Non-IT",
    description: "Support pharmaceutical clients.",
    companyName: "Example Health",
    location: "Newark, NJ",
    employmentType: "Full-time",
  };

  assert.equal(matchesFilters(job, {
    category: "BOTH",
    roles: ["Medical Representative", "Healthcare Sales Representative"],
    locations: ["New York", "New Jersey"],
    industries: ["Healthcare", "Pharmaceutical"],
    keywords: ["pharmaceutical sales", "healthcare sales"],
    employmentTypes: ["Full-time"],
  }), true);

  assert.equal(matchesFilters({
    ...job,
    jobTitle: "Healthcare Sales Representative",
    category: "Unclassified",
  }, {
    category: "BOTH",
    roles: ["Medical Representative", "Healthcare Sales Representative"],
    locations: ["New York", "New Jersey"],
  }), true);
});

test("campaign keywords improve relevance without excluding a direct role match", () => {
  assert.equal(matchesFilters({
    jobTitle: "Medical Representative",
    category: "Non-IT",
    description: "Territory sales role.",
    location: "New York, NY",
  }, {
    category: "BOTH",
    roles: ["Medical Representative"],
    keywords: ["pharmaceutical sales", "healthcare sales"],
  }), true);

  assert.equal(matchesFilters({
    jobTitle: "Office Coordinator",
    category: "Unclassified",
    description: "Coordinates general office supplies.",
    location: "New York, NY",
  }, {
    category: "BOTH",
    roles: ["Medical Representative"],
    industries: ["Healthcare", "Pharmaceutical"],
    keywords: ["pharmaceutical sales", "healthcare sales"],
  }), false);

  assert.equal(matchesFilters({
    jobTitle: "Office Coordinator",
    category: "Unclassified",
    description: "The company offers pharmaceutical sales training.",
    location: "New York, NY",
  }, {
    category: "BOTH",
    roles: ["Medical Representative"],
    keywords: ["pharmaceutical sales"],
  }), false);
});

test("missing ATS employment or location details are permissive, known mismatches are not", () => {
  const job = {
    jobTitle: "Medical Representative",
    category: "Non-IT",
    description: "Healthcare sales.",
    location: null,
    employmentType: null,
  };
  const filters = {
    category: "BOTH",
    roles: ["Medical Representative"],
    locations: ["New York", "New Jersey"],
    employmentTypes: ["Full-time"],
  };

  assert.equal(matchesFilters(job, filters), true);
  assert.equal(matchesFilters({ ...job, location: "London, UK" }, filters), false);
  assert.equal(matchesFilters({ ...job, employmentType: "Part-time" }, filters), false);
  assert.equal(matchesFilters({ ...job, employmentType: "Full time" }, filters), true);
});

test("optional manual title and location filters remain additional constraints", () => {
  const job = {
    jobTitle: "Healthcare Sales Representative",
    category: "Non-IT",
    description: "Pharmaceutical sales.",
    location: "Newark, NJ",
  };
  const campaign = {
    category: "BOTH",
    roles: ["Medical Representative", "Healthcare Sales Representative"],
    locations: ["New Jersey"],
    keywords: ["pharmaceutical sales"],
  };

  assert.equal(matchesFilters(job, campaign), true);
  assert.equal(matchesFilters(job, { ...campaign, title: "Nurse" }), false);
  assert.equal(matchesFilters(job, { ...campaign, location: "London" }), false);
});

test("role families include relevant title variants but keep generic sales roles separate", () => {
  assert.equal(matchesFilters({
    jobTitle: "Production Operator",
    category: "Non-IT",
    location: "Austin, Texas",
  }, {
    category: "BOTH",
    roles: ["Manufacturing Technician"],
  }), true);
  assert.equal(matchesFilters({
    jobTitle: "Territory Sales Representative",
    category: "Non-IT",
  }, {
    category: "BOTH",
    roles: ["Medical Sales Representative"],
  }), false);
  assert.equal(matchesFilters({
    jobTitle: "Territory Sales Representative, Oncology",
    category: "Non-IT",
  }, {
    category: "BOTH",
    roles: ["Medical Sales Representative"],
  }), true);
  assert.equal(matchesFilters({
    jobTitle: "Staff Technical Program Manager, Operations",
    category: "IT",
  }, {
    category: "BOTH",
    roles: ["Operations Manager"],
  }), false);
});

test("verified non-IT employer boards are added without duplicate provider identifiers", () => {
  assert.ok(DEFAULT_BOARDS.GREENHOUSE.includes("chargepoint"));
  assert.ok(DEFAULT_BOARDS.GREENHOUSE.includes("gymshark"));
  assert.ok(DEFAULT_BOARDS.GREENHOUSE.includes("tide"));
  assert.ok(DEFAULT_BOARDS.LEVER.includes("gopuff"));
  assert.ok(DEFAULT_BOARDS.LEVER.includes("zopa"));
  assert.ok(DEFAULT_BOARDS.ASHBY.includes("sondermind"));
  assert.ok(DEFAULT_BOARDS.ASHBY.includes("multiverse"));
  for (const boards of Object.values(DEFAULT_BOARDS)) {
    assert.equal(new Set(boards).size, boards.length);
  }
});

test("discovery distinguishes a connected board from zero campaign matches", async () => {
  const originalFetch = global.fetch;
  global.fetch = async () => new Response(JSON.stringify({
    jobs: [{
      id: 900,
      title: "Registered Nurse",
      absolute_url: "https://boards.greenhouse.io/empty-board/jobs/900",
      company_name: "Example Health",
      location: { name: "New York, NY" },
      content: "Provide patient care at a New York hospital.",
    }],
  }), {
    status: 200,
    headers: { "content-type": "application/json" },
  });

  try {
    const result = await discoverAtsJobs({
      source: "GREENHOUSE",
      country: "US",
      roles: ["Medical Representative"],
      locations: ["New York", "New Jersey"],
      boards: [{ provider: "GREENHOUSE", slug: "empty-board" }],
      onlyRequestedBoards: true,
    });

    assert.equal(result.sourceStatus.length, 1);
    assert.equal(result.sourceStatus[0].status, "CONNECTED");
    assert.equal(result.sourceStatus[0].returned, 1);
    assert.deepEqual(result.opportunities, []);
  } finally {
    global.fetch = originalFetch;
  }
});

test("live vacancies include evidence-based match reasons and available normalized pay and industry", async () => {
  const originalFetch = global.fetch;
  global.fetch = async () => new Response(JSON.stringify({
    jobs: [{
      id: 901,
      title: "Production Technician",
      absolute_url: "https://boards.greenhouse.io/formlabs/jobs/901",
      company_name: "Formlabs",
      location: { name: "Somerville, Massachusetts, United States" },
      content: "Manufacturing shift work, $28 - $32 per hour.",
      departments: [{ name: "Manufacturing" }],
    }],
  }), {
    status: 200,
    headers: { "content-type": "application/json" },
  });

  try {
    const result = await discoverAtsJobs({
      source: "GREENHOUSE",
      country: "US",
      category: "BOTH",
      roles: ["Manufacturing Technician"],
      industries: ["Manufacturing"],
      locations: ["Massachusetts"],
      keywords: ["manufacturing shift work"],
      boards: [{ provider: "GREENHOUSE", slug: "formlabs" }],
      onlyRequestedBoards: true,
    });

    assert.equal(result.opportunities.length, 1);
    assert.match(result.opportunities[0].matchingExplanation, /Role match: Manufacturing Technician/);
    assert.match(result.opportunities[0].matchingExplanation, /Industry signal: Manufacturing/);
    assert.equal(result.opportunities[0].industry, "Manufacturing and Production");
    assert.equal(result.opportunities[0].salaryCurrency, "USD");
    assert.equal(result.opportunities[0].salaryPeriod, "hour");
  } finally {
    global.fetch = originalFetch;
  }
});

test("board discovery respects bounded concurrency", async () => {
  const originalFetch = global.fetch;
  let active = 0;
  let maximumActive = 0;
  global.fetch = async () => {
    active += 1;
    maximumActive = Math.max(maximumActive, active);
    await new Promise((resolve) => setTimeout(resolve, 5));
    active -= 1;
    return new Response(JSON.stringify({ jobs: [] }), {
      status: 200,
      headers: { "content-type": "application/json" },
    });
  };

  try {
    const result = await discoverAtsJobs({
      source: "GREENHOUSE",
      country: "US",
      boards: Array.from({ length: 24 }, (_, index) => ({
        provider: "GREENHOUSE",
        slug: `test-board-${index}`,
      })),
      onlyRequestedBoards: true,
    });

    assert.equal(result.sourceStatus.length, 24);
    assert.ok(maximumActive > 1);
    assert.ok(maximumActive <= 8);
  } finally {
    global.fetch = originalFetch;
  }
});

test("provider authorization and rate-limit responses are reported distinctly", async () => {
  const originalFetch = global.fetch;
  try {
    for (const [httpStatus, expected] of [[403, "AUTH_REQUIRED"], [429, "RATE_LIMITED"]]) {
      global.fetch = async () => new Response("{}", { status: httpStatus });
      const result = await discoverAtsJobs({
        source: "GREENHOUSE",
        country: "US",
        boards: [{ provider: "GREENHOUSE", slug: "limited-board" }],
        onlyRequestedBoards: true,
      });
      assert.equal(result.sourceStatus[0].status, expected);
    }
  } finally {
    global.fetch = originalFetch;
  }
});

test("manual public ATS URL search still queries only its verified board", async () => {
  const originalFetch = global.fetch;
  const requestedUrls = [];
  global.fetch = async (url) => {
    requestedUrls.push(String(url));
    return new Response(JSON.stringify({
      jobs: [{
        id: 456,
        title: "Healthcare Sales Representative",
        absolute_url: "https://boards.greenhouse.io/stripe/jobs/456",
        company_name: "Stripe",
        location: { name: "New York, NY" },
      }],
    }), {
      status: 200,
      headers: { "content-type": "application/json" },
    });
  };

  try {
    const result = await searchFromUrl({
      url: "https://boards.greenhouse.io/stripe",
      country: "US",
      category: "BOTH",
    });

    assert.deepEqual(requestedUrls, [
      "https://boards-api.greenhouse.io/v1/boards/stripe/jobs?content=true",
    ]);
    assert.equal(result.urlResolution.mode, "LIVE_API");
    assert.equal(result.sourceStatus, "LIVE_API");
    assert.equal(result.opportunities.length, 1);
    assert.equal(result.opportunities[0].sourceUrl, "https://boards.greenhouse.io/stripe/jobs/456");
  } finally {
    global.fetch = originalFetch;
  }
});

test("unsupported careers URL returns manual link without unrelated ATS jobs", async () => {
  const result = await searchFromUrl({
    url: "https://careers.example.org/jobs?q=accountant",
    country: "US",
    category: "BOTH",
  });
  assert.equal(result.urlResolution.provider, "DIRECT_CAREERS");
  assert.equal(result.urlResolution.mode, "MANUAL_LINK");
  assert.equal(result.opportunities.length, 0);
  assert.equal(result.providerStatus.length, 0);
});

const test = require("node:test");
const assert = require("node:assert/strict");
const { matchesFilters } = require("./atsSources");

function matches(job, role = "carpenter") {
  return matchesFilters(
    {
      category: "Non-IT",
      employmentType: "Full-Time",
      ...job,
    },
    {
      category: "BOTH",
      roles: [role],
      keywords: [],
      industries: [],
      locations: [],
      employmentTypes: [],
    }
  );
}

test("matches direct Carpenter title", () => {
  assert.equal(matches({ jobTitle: "Carpenter" }), true);
});

test("matches Finish Carpenter title", () => {
  assert.equal(matches({ jobTitle: "Finish Carpenter" }), true);
});

test("matches Cabinet Maker title", () => {
  assert.equal(matches({ jobTitle: "Cabinet Maker" }), true);
});

test("matches Woodworker title", () => {
  assert.equal(matches({ jobTitle: "Woodworker" }), true);
});

test("matches Maintenance Technician with multiple carpentry duties", () => {
  assert.equal(
    matches({
      jobTitle: "Maintenance Technician",
      description: "Perform wood framing, carpentry repairs and trim installation.",
    }),
    true
  );
});

test("matches Millwright only when duties include carpentry evidence", () => {
  assert.equal(
    matches({
      jobTitle: "Millwright",
      description: "Perform woodworking, joinery and wood fabrication.",
    }),
    true
  );
});

test("rejects Maintenance Technician with only electrical duties", () => {
  assert.equal(
    matches({
      jobTitle: "Maintenance Technician",
      description: "Repair electrical motors, wiring and control panels.",
    }),
    false
  );
});

test("rejects Project Manager with incidental carpentry mention", () => {
  assert.equal(
    matches({
      jobTitle: "Workplace Project Manager",
      description: "Coordinate office projects and communicate with carpentry contractors.",
    }),
    false
  );
});

test("does not match unrelated jobs because company name contains Carpenter", () => {
  assert.equal(
    matches({
      jobTitle: "Account Manager",
      companyName: "Carpenter Industries",
      description: "Manage customer accounts and sales.",
    }),
    false
  );
});

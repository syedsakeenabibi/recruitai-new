const assert = require("node:assert/strict");
const test = require("node:test");
const { findPublishedHiringChannels } = require("./contactDiscovery");

test("only explicitly published business emails in hiring context are returned as channels", () => {
  const channels = findPublishedHiringChannels(
    "For this role, email recruiting@example.com to apply. Contact jane.doe@gmail.com about unrelated matters.",
    "https://boards.greenhouse.io/example/jobs/123",
    "GREENHOUSE",
    "2026-10-09T00:00:00.000Z"
  );

  assert.equal(channels.length, 1);
  assert.equal(channels[0].email, "recruiting@example.com");
  assert.equal(channels[0].contactName, null);
  assert.equal(channels[0].verificationStatus, "VERIFIED_RECRUITMENT_CHANNEL");
  assert.equal(channels[0].evidenceUrl, "https://boards.greenhouse.io/example/jobs/123");
  assert.match(channels[0].confidenceExplanation, /No person or employer email pattern was inferred/);
});

test("no contact is fabricated from names or guessed employer email conventions", () => {
  assert.deepEqual(
    findPublishedHiringChannels(
      "The recruiter is Jane Doe. The hiring manager is Alex Smith. Apply on the employer job page.",
      "https://jobs.ashbyhq.com/example/123",
      "ASHBY",
      "2026-10-09T00:00:00.000Z"
    ),
    []
  );
});

test("duplicate published recruiting addresses appear only once", () => {
  const channels = findPublishedHiringChannels(
    "Send applications to hiring@example.com. For recruitment enquiries use hiring@example.com.",
    "https://jobs.lever.co/example/123",
    "LEVER",
    "2026-10-09T00:00:00.000Z"
  );
  assert.equal(channels.length, 1);
});

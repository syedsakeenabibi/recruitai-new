const assert = require("node:assert/strict");
const test = require("node:test");
const { validateFindHiringContactsRequest } = require("./ra.validation");

test("contact lookup accepts only a saved opportunity identifier and an empty payload", () => {
  assert.deepEqual(validateFindHiringContactsRequest({}, "opportunity-123"), {
    opportunityId: "opportunity-123",
  });
  assert.throws(
    () => validateFindHiringContactsRequest({ email: "fake@example.com" }, "opportunity-123"),
    /does not accept client-supplied contact details/
  );
  assert.throws(
    () => validateFindHiringContactsRequest({}, ""),
    /valid saved opportunity ID/
  );
});

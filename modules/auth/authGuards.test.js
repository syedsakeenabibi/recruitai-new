const assert = require("node:assert/strict");
const test = require("node:test");
const { requireRoles } = require("./requireRoles");
const { isSessionRevoked, revokeSession } = require("./sessionRevocation");

function response() {
  return {
    statusCode: null,
    body: null,
    status(code) {
      this.statusCode = code;
      return this;
    },
    json(body) {
      this.body = body;
      return this;
    },
  };
}

test("role authorization rejects missing or disallowed roles and allows configured roles", () => {
  const guard = requireRoles(["ADMIN", "RA"]);
  const missingResponse = response();
  guard({}, missingResponse, () => assert.fail("unauthenticated request must not pass"));
  assert.equal(missingResponse.statusCode, 401);

  const forbiddenResponse = response();
  guard({ admin: { role: "RECRUITER" } }, forbiddenResponse, () => assert.fail("wrong role must not pass"));
  assert.equal(forbiddenResponse.statusCode, 403);

  const permittedResponse = response();
  let nextCalled = false;
  guard({ admin: { role: "RA" } }, permittedResponse, () => { nextCalled = true; });
  assert.equal(nextCalled, true);
});

test("logged-out session tokens are rejected until their expiry", () => {
  const now = Date.now();
  const id = `session-${now}`;
  assert.equal(revokeSession(id, now + 1000, now), true);
  assert.equal(isSessionRevoked(id, now + 500), true);
  assert.equal(isSessionRevoked(id, now + 1000), false);
  assert.equal(revokeSession("expired", now, now), false);
});

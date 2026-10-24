const revokedSessions = new Map();

function isSessionRevoked(sessionId, now = Date.now()) {
  if (!sessionId) return false;
  const expiresAt = revokedSessions.get(sessionId);
  if (!expiresAt) return false;
  if (expiresAt <= now) {
    revokedSessions.delete(sessionId);
    return false;
  }
  return true;
}

function revokeSession(sessionId, expiresAt, now = Date.now()) {
  if (!sessionId || !Number.isFinite(expiresAt) || expiresAt <= now) return false;
  for (const [id, expiry] of revokedSessions) {
    if (expiry <= now) revokedSessions.delete(id);
  }
  revokedSessions.set(sessionId, expiresAt);
  return true;
}

module.exports = { isSessionRevoked, revokeSession };

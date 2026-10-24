const ROLES = Object.freeze(["ADMIN", "MANAGER", "BDM", "RA", "RECRUITER"]);

function requireRoles(...allowedRoles) {
  const allowed = new Set(allowedRoles);
  for (const role of allowed) {
    if (!ROLES.includes(role)) throw new TypeError(`Unsupported application role: ${role}`);
  }

  return function roleAuthorization(req, res, next) {
    if (!req.admin) {
      return res.status(401).json({ success: false, error: "Authentication required." });
    }
    if (!allowed.has(req.admin.role)) {
      return res.status(403).json({ success: false, error: "This role is not authorized for the requested action." });
    }
    return next();
  };
}

module.exports = { ROLES, requireRoles };

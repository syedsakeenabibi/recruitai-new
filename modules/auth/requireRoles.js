function requireRoles(roles) {
  const allowedRoles = new Set(roles);
  return function roleAuthorization(req, res, next) {
    if (!req.admin) {
      return res.status(401).json({
        success: false,
        error: "Authentication required.",
      });
    }
    if (!allowedRoles.has(req.admin.role)) {
      return res.status(403).json({
        success: false,
        error: "This account does not have permission to access this resource.",
      });
    }
    return next();
  };
}

module.exports = { requireRoles };

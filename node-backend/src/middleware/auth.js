// Access control lives here so it can be swapped for real user management (JWT / roles) later without touching routes.
const crypto = require("crypto");

const digest = (s) => crypto.createHash("sha256").update(String(s)).digest();

// Admin-only guard for stored data. Key sent as `X-API-Key: <key>` or `Authorization: Bearer <key>`.
function requireAdmin(config) {
  return (req, res, next) => {
    if (!config.adminApiKey)
      return res.status(503).json({ error: { code: "admin_key_not_configured", message: "Set ADMIN_API_KEY to enable this endpoint.", details: null } });
    const bearer = (req.get("authorization") || "").replace(/^Bearer\s+/i, "");
    const given = req.get("x-api-key") || bearer;
    if (!given || !crypto.timingSafeEqual(digest(given), digest(config.adminApiKey)))
      return res.status(401).json({ error: { code: "unauthorized", message: "Missing or invalid API key.", details: null } });
    next();
  };
}
module.exports = { requireAdmin };

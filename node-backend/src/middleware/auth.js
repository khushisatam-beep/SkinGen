// Access control lives here so it can be swapped for real user management (JWT / roles) later without touching routes.
const crypto = require("crypto");
const makeUserModel = require("../models/User");

const lastActivityWrites = new Map();
const LAST_ACTIVITY_WRITE_INTERVAL_MS = 5 * 60 * 1000;

const digest = (s) => crypto.createHash("sha256").update(String(s)).digest();

function safeEqual(left, right) {
  return crypto.timingSafeEqual(digest(left), digest(right));
}

function verifyAdminCredentials(config, email, password) {
  return safeEqual(String(email || "").trim().toLowerCase(), String(config.adminEmail || "").trim().toLowerCase())
    && safeEqual(password || "", config.adminPassword || "");
}

function userTokenSecret(config) {
  return config.userTokenSecret || config.adminApiKey || "";
}

function createUserToken(userId, config) {
  const secret = userTokenSecret(config);
  if (!secret) throw new Error("USER_TOKEN_SECRET must be configured to issue user sessions.");
  const encode = (value) => Buffer.from(JSON.stringify(value)).toString("base64url");
  const header = encode({ alg: "HS256", typ: "JWT" });
  const payload = encode({ sub: String(userId), exp: Math.floor(Date.now() / 1000) + 60 * 60 * 24 * 7 });
  const unsigned = `${header}.${payload}`;
  const signature = crypto.createHmac("sha256", secret).update(unsigned).digest("base64url");
  return `${unsigned}.${signature}`;
}

function verifyUserToken(token, config) {
  const secret = userTokenSecret(config);
  if (!secret) return null;
  const parts = String(token || "").split(".");
  if (parts.length !== 3) return null;
  const unsigned = `${parts[0]}.${parts[1]}`;
  const expected = crypto.createHmac("sha256", secret).update(unsigned).digest();
  let received;
  try { received = Buffer.from(parts[2], "base64url"); } catch { return null; }
  if (received.length !== expected.length || !crypto.timingSafeEqual(received, expected)) return null;
  try {
    const payload = JSON.parse(Buffer.from(parts[1], "base64url").toString("utf8"));
    if (!payload.sub || !Number.isFinite(payload.exp) || payload.exp <= Math.floor(Date.now() / 1000)) return null;
    return payload;
  } catch { return null; }
}

function requireUser(config, db) {
  return async (req, res, next) => {
    const bearer = (req.get("authorization") || "").replace(/^Bearer\s+/i, "");
    const payload = verifyUserToken(bearer, config);
    if (!payload) return res.status(401).json({ error: { code: "unauthorized", message: "Sign in to continue.", details: null } });
    if (!db.isReady()) return res.status(503).json({ error: { code: "database_unavailable", message: "Account storage is unavailable.", details: null } });
    try {
      const user = await makeUserModel().findById(payload.sub).lean();
      if (!user) {
        lastActivityWrites.delete(String(payload.sub));
        return res.status(401).json({ error: { code: "account_deleted", message: "This account is no longer available.", details: null } });
      }
      const userId = String(user._id);
      const now = Date.now();
      if (now - (lastActivityWrites.get(userId) || 0) >= LAST_ACTIVITY_WRITE_INTERVAL_MS) {
        try {
          await makeUserModel().updateOne({ _id: user._id }, { $set: { lastActiveAt: new Date(now) } });
          lastActivityWrites.set(userId, now);
        } catch { /* Activity metadata must not interrupt an otherwise valid user request. */ }
      }
      req.user = { id: String(user._id), name: user.name, email: user.email, phone: user.phone || "", age: user.age ?? "", gender: user.gender || "" };
      return next();
    } catch (error) { return next(error); }
  };
}

// Admin-only guard for stored data. Key sent as `X-API-Key: <key>` or `Authorization: Bearer <key>`.
function requireAdmin(config) {
  return (req, res, next) => {
    if (!config.adminApiKey)
      return res.status(503).json({ error: { code: "admin_key_not_configured", message: "Set ADMIN_API_KEY to enable this endpoint.", details: null } });
    const bearer = (req.get("authorization") || "").replace(/^Bearer\s+/i, "");
    const given = req.get("x-api-key") || bearer;
    if (!given || !safeEqual(given, config.adminApiKey))
      return res.status(401).json({ error: { code: "unauthorized", message: "Missing or invalid API key.", details: null } });
    next();
  };
}
module.exports = { requireAdmin, verifyAdminCredentials, requireUser, createUserToken, verifyUserToken };

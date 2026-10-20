// All settings come from environment variables (see ../.env.example). No secrets in code.
const bool = (v, d) => (v === undefined ? d : ["1", "true", "yes"].includes(String(v).toLowerCase()));

module.exports = {
  port: Number(process.env.PORT || 5000),
  mlServiceUrl: (process.env.ML_SERVICE_URL || "http://127.0.0.1:8001").replace(/\/$/, ""),
  mlTimeoutMs: Number(process.env.ML_TIMEOUT_MS || 10000),
  corsOrigin: process.env.CORS_ORIGIN || "", // empty = CORS disabled
  // User accounts and consented assessment reports require MongoDB.
  enableHistory: bool(process.env.ENABLE_HISTORY, true),
  mongoUri: process.env.MONGODB_URI || "",
  mongoTimeoutMs: Number(process.env.MONGODB_TIMEOUT_MS || 3000),
  adminApiKey: process.env.ADMIN_API_KEY || "skingen-local-admin-key-change-me", // protects admin data routes
  userTokenSecret: process.env.USER_TOKEN_SECRET || process.env.ADMIN_API_KEY || "",
  adminEmail: process.env.ADMIN_EMAIL || "admin@skingen.local",
  adminPassword: process.env.ADMIN_PASSWORD || "change-this-admin-password",
  rateLimitPerMin: Number(process.env.RATE_LIMIT_PER_MIN || 60), // per IP on /assess; 0 = off
  trustProxy: process.env.TRUST_PROXY || "",              // e.g. "1" when behind nginx / a load balancer
};

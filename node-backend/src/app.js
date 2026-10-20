// Express gateway. Validation lives in the Python service (one source of truth); Node checks that the body is
// a JSON object and forwards the ML service's status code and body unchanged.
const express = require("express");
const cors = require("cors");
const helmet = require("helmet");
const rateLimit = require("express-rate-limit");
const { requireAdmin, verifyAdminCredentials, requireUser } = require("./middleware/auth");
const { createUsers } = require("./services/users");
const { MlUnavailableError } = require("./services/mlClient");

const GET_ROUTES = {
  "/api/v1/questionnaire": "/v1/questionnaire",
  "/api/v1/capabilities": "/v1/capabilities",
  "/api/v1/model-info": "/v1/model-info",
  "/api/v1/model-comparison": "/v1/model-comparison",
};

const POST_ROUTES = {
  "/api/v1/family-history-analysis": "/v1/family-history-analysis",
  "/api/v1/hereditary-risk": "/v1/hereditary-risk",
};
const err = (res, status, code, message, details = null) => res.status(status).json({ error: { code, message, details } });

function createApp({ ml, db, history, config, users: usersOverride, userAuth: userAuthOverride }) {
  const app = express();
  const users = usersOverride || createUsers({ db, config, history });
  const userAuth = userAuthOverride || requireUser(config, db);
  app.disable("x-powered-by");
  if (config.trustProxy) app.set("trust proxy", /^\d+$/.test(config.trustProxy) ? Number(config.trustProxy) : config.trustProxy);
  app.use(helmet());
  if (config.corsOrigin) app.use(cors({ origin: config.corsOrigin.split(",") }));
  app.use(express.json({ limit: "50kb" }));

  app.get("/", (req, res) => res.send("SkinGen backend is running"));
  app.get("/api/v1/health/live", (req, res) => res.json({ status: "ok" }));

  // 200 ok/degraded (database problems only degrade), 503 when the ML service is unreachable or its model failed to load.
  app.get("/api/v1/health", async (req, res) => {
    const database = db.getStatus();
    let mlService;
    try {
      const r = await ml.get("/health");
      mlService = { status: r.status === 200 ? "ok" : "degraded", detail: r.data };
    } catch (e) { mlService = { status: "unreachable", error: e.message }; }
    const ok = mlService.status === "ok";
    const degraded = ok && database.status === "unavailable";
    res.status(ok ? 200 : 503).json({ status: !ok ? "unavailable" : degraded ? "degraded" : "ok", node: { status: "ok" }, mlService, database });
  });

  for (const [path, target] of Object.entries(GET_ROUTES)) {
    app.get(path, async (req, res, next) => {
      try { const r = await ml.get(target); res.status(r.status).json(r.data); } catch (e) { next(e); }
    });
  }


  const limiter = config.rateLimitPerMin > 0
    ? rateLimit({ windowMs: 60000, limit: config.rateLimitPerMin, standardHeaders: true, legacyHeaders: false,
        handler: (q, r) => err(r, 429, "rate_limited", "Too many requests. Please wait a minute and try again.") })
    : (q, r, n) => n();

  app.post("/api/v1/users/register", limiter, async (req, res, next) => {
    try {
      if (!req.is("application/json") || !req.body || typeof req.body !== "object" || Array.isArray(req.body))
        return err(res, 400, "invalid_body", "Name, email, and password are required.");
      const result = await users.register(req.body);
      return res.status(201).json(result);
    } catch (error) { return next(error); }
  });

  app.post("/api/v1/users/login", limiter, async (req, res, next) => {
    try {
      if (!req.is("application/json") || !req.body || typeof req.body !== "object" || Array.isArray(req.body))
        return err(res, 400, "invalid_body", "Email and password are required.");
      return res.json(await users.authenticate(req.body.email, req.body.password));
    } catch (error) { return next(error); }
  });

  app.post("/api/v1/admin/login", limiter, (req, res) => {
    if (!req.is("application/json") || !req.body || typeof req.body !== "object")
      return err(res, 400, "invalid_body", "Email and password are required.");
    const { email, password } = req.body;
    if (!verifyAdminCredentials(config, email, password))
      return err(res, 401, "invalid_admin_credentials", "The admin email or password is incorrect.");
    res.json({ authenticated: true, role: "admin", email: config.adminEmail, token: config.adminApiKey });
  });

  app.get("/api/v1/users/me", userAuth, async (req, res, next) => {
    try { return res.json({ user: await users.getById(req.user.id) }); } catch (error) { return next(error); }
  });

  app.patch("/api/v1/users/me", userAuth, async (req, res, next) => {
    try {
      if (!req.is("application/json") || !req.body || typeof req.body !== "object" || Array.isArray(req.body))
        return err(res, 400, "invalid_body", "Profile updates must be a JSON object.");
      return res.json({ user: await users.updateProfile(req.user.id, req.body) });
    } catch (error) { return next(error); }
  });

  app.post("/api/v1/users/me/password", userAuth, async (req, res, next) => {
    try {
      if (!req.is("application/json") || !req.body || typeof req.body !== "object" || Array.isArray(req.body))
        return err(res, 400, "invalid_body", "Current and new passwords are required.");
      await users.changePassword(req.user.id, req.body.currentPassword, req.body.newPassword);
      return res.json({ changed: true });
    } catch (error) { return next(error); }
  });

  app.delete("/api/v1/users/me", userAuth, async (req, res, next) => {
    try {
      await users.deleteAccount(req.user.id);
      return res.json({ deleted: true, reportsRetained: true });
    } catch (error) { return next(error); }
  });

  app.get("/api/v1/users/me/records", userAuth, async (req, res, next) => {
    try {
      const rows = await history.listForUser(req.user.id);
      if (rows === null) return err(res, 503, "history_unavailable", "Saved reports are not available because database storage is unavailable.", db.getStatus());
      return res.json({ count: rows.length, records: rows });
    } catch (error) { return next(error); }
  });

  app.delete("/api/v1/users/me/records/:id", userAuth, async (req, res, next) => {
    try {
      const deleted = await history.deleteRecord(req.params.id, req.user.id);
      if (deleted === null) return err(res, 503, "database_unavailable", "The report database is unavailable.", db.getStatus());
      if (!deleted) return err(res, 404, "record_not_found", "The saved report could not be found.");
      return res.json({ deleted: true });
    } catch (error) { return next(error); }
  });


  for (const [path, target] of Object.entries(POST_ROUTES)) {
  app.post(path, limiter, async (req, res, next) => {
    try {
      if (!req.is("application/json")) {
        return err(
          res,
          415,
          "unsupported_media_type",
          "Content-Type must be application/json."
        );
      }

      if (
        !req.body ||
        typeof req.body !== "object" ||
        Array.isArray(req.body)
      ) {
        return err(
          res,
          400,
          "invalid_body",
          "Request body must be a JSON object."
        );
      }

      const r = await ml.post(target, req.body);
      return res.status(r.status).json(r.data);
    } catch (e) {
      next(e);
    }
  });
}

  // Consent and client-supplied identity are gateway-only fields; authenticated account data supplies the saved owner.
  app.post("/api/v1/assess", limiter, userAuth, async (req, res, next) => {
    try {
      if (!req.is("application/json")) return err(res, 415, "unsupported_media_type", "Content-Type must be application/json.");
      if (!req.body || typeof req.body !== "object" || Array.isArray(req.body))
        return err(res, 400, "invalid_body", "Request body must be a JSON object.");
      const { consentToStore, user: _clientUser, ...forward } = req.body;
      if (consentToStore !== undefined && typeof consentToStore !== "boolean")
        return err(res, 400, "invalid_consent", "consentToStore must be true or false.");
      if (consentToStore !== true)
        return err(res, 400, "consent_required", "Consent to store this screening in SkinGen's database is required before results can be generated.");
      if (forward.answers?.age !== undefined && forward.answers.age !== null && forward.answers.age !== "") {
        const updatedUser = await users.updateProfile(req.user.id, { age: forward.answers.age });
        req.user.age = updatedUser.age;
      }
      const r = await ml.post("/v1/assess", forward);
      if (r.status === 200) {
        const recordId = await history.recordAssessment({ ...forward, user: req.user, userId: req.user.id }, r.data);
        if (!recordId) return err(res, 503, "save_failed", "The screening result could not be saved to the database, so no result was returned. Please try again.");
        res.set("X-History-Saved", "true").set("X-Record-Id", String(recordId));
      }
      res.status(r.status).json(r.data);
    } catch (e) { next(e); }
  });

  app.get("/api/v1/history", requireAdmin(config), async (req, res, next) => {
    try {
      const rows = await history.list(Number(req.query.limit) || 20);
      if (rows === null) return err(res, 503, "history_disabled", "History is disabled or the database is unavailable.", db.getStatus());
      res.json({ count: rows.length, records: rows });
    } catch (e) { next(e); }
  });

  app.get("/api/v1/admin/records", requireAdmin(config), async (req, res, next) => {
    try {
      const [rows, count] = await Promise.all([history.list(Number(req.query.limit) || 100), history.countRecords()]);
      if (rows === null || count === null) return err(res, 503, "history_disabled", "Saved data is not available because database storage is not ready.", db.getStatus());
      res.json({ count, records: rows });
    } catch (e) { next(e); }
  });

  app.get("/api/v1/admin/users", requireAdmin(config), async (req, res, next) => {
    try { return res.json(await users.listAdmin(req.query.limit)); } catch (error) { return next(error); }
  });

  app.delete("/api/v1/admin/users/:id", requireAdmin(config), async (req, res, next) => {
    try {
      await users.deleteAccount(req.params.id);
      return res.json({ deleted: true, reportsRetained: true });
    } catch (error) { return next(error); }
  });

  app.delete("/api/v1/admin/records/:id", requireAdmin(config), async (req, res, next) => {
    try {
      const deleted = await history.deleteRecord(req.params.id);
      if (deleted === null) return err(res, 503, "database_unavailable", "The report database is unavailable.", db.getStatus());
      if (!deleted) return err(res, 404, "record_not_found", "The saved report could not be found.");
      return res.json({ deleted: true });
    } catch (error) { return next(error); }
  });

  app.use((req, res) => err(res, 404, "not_found", `No route ${req.method} ${req.path}`));
  // eslint-disable-next-line no-unused-vars
  app.use((e, req, res, next) => {
    if (e.status && e.code) return err(res, e.status, e.code, e.message);
    if (e instanceof MlUnavailableError) return err(res, e.timeout ? 504 : 502, "ml_service_unavailable", e.message);
    if (e.type === "entity.parse.failed") return err(res, 400, "invalid_json", "Request body is not valid JSON.");
    if (e.type === "entity.too.large") return err(res, 413, "payload_too_large", "Request body too large.");
    console.error(e);
    return err(res, 500, "internal_error", "Unexpected server error.");
  });
  return app;
}
module.exports = { createApp };

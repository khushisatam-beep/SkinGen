// Express gateway. Validation lives in the Python service (one source of truth); Node checks that the body is
// a JSON object and forwards the ML service's status code and body unchanged.
const express = require("express");
const cors = require("cors");
const helmet = require("helmet");
const rateLimit = require("express-rate-limit");
const { requireAdmin } = require("./middleware/auth");
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

function createApp({ ml, db, history, config }) {
  const app = express();
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

  // `consentToStore` is a gateway field (stripped before the ML service sees the body). Nothing is saved unless it is exactly true.
  app.post("/api/v1/assess", limiter, async (req, res, next) => {
    try {
      if (!req.is("application/json")) return err(res, 415, "unsupported_media_type", "Content-Type must be application/json.");
      if (!req.body || typeof req.body !== "object" || Array.isArray(req.body))
        return err(res, 400, "invalid_body", "Request body must be a JSON object.");
      const { consentToStore, ...forward } = req.body;
      if (consentToStore !== undefined && typeof consentToStore !== "boolean")
        return err(res, 400, "invalid_consent", "consentToStore must be true or false.");
      const r = await ml.post("/v1/assess", forward);
      if (r.status === 200) res.set("X-History-Saved", String(consentToStore === true ? await history.recordAssessment(forward, r.data) : false));
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

  app.use((req, res) => err(res, 404, "not_found", `No route ${req.method} ${req.path}`));
  // eslint-disable-next-line no-unused-vars
  app.use((e, req, res, next) => {
    if (e instanceof MlUnavailableError) return err(res, e.timeout ? 504 : 502, "ml_service_unavailable", e.message);
    if (e.type === "entity.parse.failed") return err(res, 400, "invalid_json", "Request body is not valid JSON.");
    if (e.type === "entity.too.large") return err(res, 413, "payload_too_large", "Request body too large.");
    console.error(e);
    return err(res, 500, "internal_error", "Unexpected server error.");
  });
  return app;
}
module.exports = { createApp };

const request = require("supertest");
const { startFakeMl, buildApp } = require("./helpers");
let fake;
afterEach(async () => { if (fake) await fake.close(); fake = null; });

const answers = { scaling: "severe", itching: "mild", redness: "mild", age: 30 };

test("POST /assess forwards body to ML and returns its response unchanged", async () => {
  fake = await startFakeMl(() => ({ json: { topCondition: { condition: "psoriasis" }, predictions: [] } }));
  const { app } = buildApp({ mlUrl: fake.url });
  const r = await request(app).post("/api/v1/assess").send({ answers });
  expect(r.status).toBe(200);
  expect(fake.calls[0]).toMatchObject({ method: "POST", url: "/v1/assess", body: { answers } });
});

test("ML validation errors (422) pass through untouched", async () => {
  const body = { error: { code: "invalid_answers", message: "x", details: [{ field: "scaling", message: "Please choose one of: none" }] } };
  fake = await startFakeMl(() => ({ status: 422, json: body }));
  const { app } = buildApp({ mlUrl: fake.url });
  const r = await request(app).post("/api/v1/assess").send({ answers: { scaling: "huge" } });
  expect(r.status).toBe(422);
  expect(r.body).toEqual(body);
});

test.each([["questionnaire"], ["capabilities"], ["model-info"], ["model-comparison"]])("GET /%s proxies", async (name) => {
  fake = await startFakeMl(() => ({ json: { ok: true } }));
  const { app } = buildApp({ mlUrl: fake.url });
  expect((await request(app).get(`/api/v1/${name}`)).status).toBe(200);
  expect(fake.calls[0].url).toBe(`/v1/${name}`);
});

test.each([
  [
    "family-history-analysis",
    "/v1/family-history-analysis",
  ],
  [
    "hereditary-risk",
    "/v1/hereditary-risk",
  ],
])("POST /api/v1/%s proxies to the ML service", async (name, target) => {
  const responseBody = {
    apiVersion: "3.1.0",
    result: { status: "descriptive_only" },
  };

  fake = await startFakeMl(() => ({
    json: responseBody,
  }));

  const { app } = buildApp({ mlUrl: fake.url });

  const payload = {
    familyHistory: {
      psoriasis: "yes",
      relatives: [],
    },
  };

  const response = await request(app)
    .post(`/api/v1/${name}`)
    .send(payload);

  expect(response.status).toBe(200);
  expect(response.body).toEqual(responseBody);
  expect(fake.calls[0]).toMatchObject({
    method: "POST",
    url: target,
    body: payload,
  });
});


describe("gateway request checks", () => {
  test("wrong content type -> 415, ML not called", async () => {
    fake = await startFakeMl(() => ({}));
    const { app } = buildApp({ mlUrl: fake.url });
    expect((await request(app).post("/api/v1/assess").set("Content-Type", "text/plain").send("hi")).status).toBe(415);
    expect(fake.calls).toHaveLength(0);
  });
  test("malformed JSON -> 400 invalid_json", async () => {
    fake = await startFakeMl(() => ({}));
    const { app } = buildApp({ mlUrl: fake.url });
    const r = await request(app).post("/api/v1/assess").set("Content-Type", "application/json").send("{bad");
    expect(r.status).toBe(400); expect(r.body.error.code).toBe("invalid_json");
  });
  test("array body -> 400", async () => {
    fake = await startFakeMl(() => ({}));
    const { app } = buildApp({ mlUrl: fake.url });
    expect((await request(app).post("/api/v1/assess").send([1])).status).toBe(400);
  });
  test("unknown route -> 404 envelope", async () => {
    fake = await startFakeMl(() => ({}));
    const { app } = buildApp({ mlUrl: fake.url });
    const r = await request(app).get("/api/v1/nope");
    expect(r.status).toBe(404); expect(r.body.error.code).toBe("not_found");
  });
});

describe("ML service unavailable", () => {
  test("connection refused -> 502", async () => {
    const { app } = buildApp({ mlUrl: "http://127.0.0.1:1" });
    const r = await request(app).post("/api/v1/assess").send({ answers });
    expect(r.status).toBe(502); expect(r.body.error.code).toBe("ml_service_unavailable");
  });
  test("timeout -> 504", async () => {
    const http = require("http");
    const slow = http.createServer(() => {});
    await new Promise((r) => slow.listen(0, "127.0.0.1", r));
    const { app } = buildApp({ mlUrl: `http://127.0.0.1:${slow.address().port}` });
    const r = await request(app).get("/api/v1/questionnaire");
    slow.closeAllConnections(); slow.close();
    expect(r.status).toBe(504);
  });
  test("health 503 unreachable; liveness still 200", async () => {
    const { app } = buildApp({ mlUrl: "http://127.0.0.1:1" });
    const h = await request(app).get("/api/v1/health");
    expect(h.status).toBe(503); expect(h.body.mlService.status).toBe("unreachable");
    expect((await request(app).get("/api/v1/health/live")).status).toBe(200);
  });
});

describe("health with ML up", () => {
  test("history disabled -> ok", async () => {
    fake = await startFakeMl(() => ({ json: { status: "ok" } }));
    const { app } = buildApp({ mlUrl: fake.url });
    const r = await request(app).get("/api/v1/health");
    expect(r.status).toBe(200);
    expect(r.body).toMatchObject({ status: "ok", database: { status: "disabled" } });
  });
  test("ML model failed to load (503) -> gateway health 503 degraded", async () => {
    fake = await startFakeMl(() => ({ status: 503, json: { status: "degraded" } }));
    const { app } = buildApp({ mlUrl: fake.url });
    const r = await request(app).get("/api/v1/health");
    expect(r.status).toBe(503); expect(r.body.mlService.status).toBe("degraded");
  });
});

describe("MongoDB unavailable but history enabled", () => {
  test("assessments still work, health 'degraded', /history 503", async () => {
    fake = await startFakeMl(({ url }) => url === "/health" ? { json: { status: "ok" } } : { json: { topCondition: { condition: "psoriasis" }, predictions: [] } });
    const { app, db } = buildApp({ mlUrl: fake.url, configOverride: { enableHistory: true, mongoUri: "mongodb://127.0.0.1:1/x", adminApiKey: "k" } });
    await db.connect();
    const r = await request(app).post("/api/v1/assess").send({ answers, consentToStore: true });
    expect(r.status).toBe(200); expect(r.headers["x-history-saved"]).toBe("false");
    const h = await request(app).get("/api/v1/health");
    expect(h.status).toBe(200); expect(h.body.status).toBe("degraded");
    expect((await request(app).get("/api/v1/history").set("x-api-key", "k")).status).toBe(503);
    await db.close();
  });
  test("enabled without MONGODB_URI -> 'unavailable', no crash", async () => {
    const { db } = buildApp({ mlUrl: "http://127.0.0.1:1", configOverride: { enableHistory: true, mongoUri: "" } });
    await db.connect();
    expect(db.getStatus().status).toBe("unavailable");
  });
});

describe("history content (fake store; real MongoDB path NOT covered)", () => {
  const mlOut = { topCondition: { condition: "psoriasis" }, answeredCount: 4, model: { name: "LogisticRegression", version: "3.0.0" },
                  predictions: [{ condition: "psoriasis", modelScore: 0.9 }, { condition: "other_scaly_rash", modelScore: 0.1 }] };
  test("saved only for successful assessments", async () => {
    fake = await startFakeMl(() => ({ json: mlOut }));
    const history = { recordAssessment: jest.fn().mockResolvedValue(true), list: jest.fn() };
    const { app } = buildApp({ mlUrl: fake.url, historyOverride: history });
    const r = await request(app).post("/api/v1/assess").send({ answers, consentToStore: true });
    expect(r.headers["x-history-saved"]).toBe("true");
    expect(history.recordAssessment).toHaveBeenCalledTimes(1);
  });
  test("not recorded when ML rejects", async () => {
    fake = await startFakeMl(() => ({ status: 422, json: { error: {} } }));
    const history = { recordAssessment: jest.fn(), list: jest.fn() };
    const { app } = buildApp({ mlUrl: fake.url, historyOverride: history });
    await request(app).post("/api/v1/assess").send({ answers: {} });
    expect(history.recordAssessment).not.toHaveBeenCalled();
  });
  test("stored document has scores only by default; answers only when STORE_INPUTS=true", async () => {
    const mongoose = require("mongoose");
    const create = jest.fn().mockResolvedValue({});
    jest.spyOn(mongoose, "model").mockReturnValue({ create });
    Object.defineProperty(mongoose.connection, "readyState", { value: 1, configurable: true });
    const { createHistory } = require("../src/services/history");
    const db = { isReady: () => true };
    await createHistory({ db, config: { storeInputs: false, historyTtlDays: 30 } }).recordAssessment({ answers }, { ...mlOut, safety: { level: "urgent_review" } });
    await createHistory({ db, config: { storeInputs: true, historyTtlDays: 30 } }).recordAssessment({ answers }, mlOut);
    expect(create.mock.calls[0][0].answers).toBeUndefined();
    expect(create.mock.calls[0][0]).toMatchObject({ consent: true, safetyLevel: "urgent_review" });
    expect(create.mock.calls[0][0].scores).toEqual({ psoriasis: 0.9, other_scaly_rash: 0.1 });
    expect(create.mock.calls[1][0].answers).toEqual(answers);
    jest.restoreAllMocks();
  });
});

describe("consent, access control, rate limiting", () => {
  const ok = { json: { topCondition: { condition: "psoriasis" }, predictions: [] } };
  test("no consent -> nothing saved, consent flag not forwarded to ML", async () => {
    fake = await startFakeMl(() => ok);
    const history = { recordAssessment: jest.fn().mockResolvedValue(true), list: jest.fn() };
    const { app } = buildApp({ mlUrl: fake.url, historyOverride: history });
    for (const extra of [{}, { consentToStore: false }]) {
      const r = await request(app).post("/api/v1/assess").send({ answers, ...extra });
      expect(r.headers["x-history-saved"]).toBe("false");
    }
    expect(history.recordAssessment).not.toHaveBeenCalled();
    expect(fake.calls.every((c) => !("consentToStore" in c.body))).toBe(true);
  });
  test("consentToStore must be a real boolean", async () => {
    fake = await startFakeMl(() => ok);
    const { app } = buildApp({ mlUrl: fake.url });
    const r = await request(app).post("/api/v1/assess").send({ answers, consentToStore: "yes" });
    expect(r.status).toBe(400); expect(r.body.error.code).toBe("invalid_consent"); expect(fake.calls).toHaveLength(0);
  });
  test("redFlags and familyHistory are forwarded untouched", async () => {
    fake = await startFakeMl(() => ok);
    const { app } = buildApp({ mlUrl: fake.url });
    const extra = { redFlags: { blisters: true }, familyHistory: { psoriasis: "yes" } };
    await request(app).post("/api/v1/assess").send({ answers, ...extra });
    expect(fake.calls[0].body).toEqual({ answers, ...extra });
  });
  test("/history: 503 without ADMIN_API_KEY, 401 wrong key, ok with key (header or bearer)", async () => {
    const list = jest.fn().mockResolvedValue([{ topCondition: "psoriasis" }]);
    const hist = { recordAssessment: jest.fn(), list };
    const none = buildApp({ mlUrl: "http://127.0.0.1:1", historyOverride: hist }).app;
    expect((await request(none).get("/api/v1/history")).status).toBe(503);
    const { app } = buildApp({ mlUrl: "http://127.0.0.1:1", historyOverride: hist, configOverride: { adminApiKey: "secret-key" } });
    expect((await request(app).get("/api/v1/history")).status).toBe(401);
    expect((await request(app).get("/api/v1/history").set("x-api-key", "wrong")).status).toBe(401);
    expect(list).not.toHaveBeenCalled();
    const a = await request(app).get("/api/v1/history").set("x-api-key", "secret-key");
    expect(a.status).toBe(200); expect(a.body.count).toBe(1);
    expect((await request(app).get("/api/v1/history").set("Authorization", "Bearer secret-key")).status).toBe(200);
  });
  test("rate limit returns 429 envelope", async () => {
    fake = await startFakeMl(() => ok);
    const { app } = buildApp({ mlUrl: fake.url, configOverride: { rateLimitPerMin: 2 } });
    const codes = [];
    for (let i = 0; i < 3; i++) codes.push((await request(app).post("/api/v1/assess").send({ answers })).status);
    expect(codes).toEqual([200, 200, 429]);
  });
  test("security headers present", async () => {
    const { app } = buildApp({ mlUrl: "http://127.0.0.1:1" });
    expect((await request(app).get("/api/v1/health/live")).headers["x-content-type-options"]).toBe("nosniff");
  });
});

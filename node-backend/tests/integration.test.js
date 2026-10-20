// Runs against a REAL Python ML service. Skipped unless ML_INTEGRATION_URL is set.
const request = require("supertest");
const { buildApp } = require("./helpers");
const url = process.env.ML_INTEGRATION_URL;
const d = url ? describe : describe.skip;

d("Node -> real FastAPI service", () => {
  const { app } = url ? buildApp({ mlUrl: url }) : {};
  const a = { age: 34, redness: "moderate", scaling: "severe", clear_edges: "severe", itching: "mild", knees_elbows: "severe", scalp: "moderate", family_history: "yes" };
  test("health", async () => { const r = await request(app).get("/api/v1/health"); expect(r.status).toBe(200); expect(r.body.status).toBe("ok"); });
  test("questionnaire", async () => { const r = await request(app).get("/api/v1/questionnaire"); expect(r.body.questions).toHaveLength(12); });
  test("assess", async () => {
    const r = await request(app).post("/api/v1/assess").send({ answers: a });
    expect(r.status).toBe(200); expect(r.body.topCondition.condition).toBe("psoriasis");
    expect(r.body.explanation.additivityCheck.absoluteDifference).toBeLessThan(1e-6);
  });
  test("friendly validation error passes through", async () => {
    const r = await request(app).post("/api/v1/assess").send({ answers: { ...a, scaling: "huge" } });
    expect(r.status).toBe(422); expect(r.body.error.details[0].message).toMatch(/Please choose one of/);
  });
  test("too few answers", async () => { expect((await request(app).post("/api/v1/assess").send({ answers: { scaling: "mild" } })).status).toBe(422); });
  test("model-info + comparison + capabilities", async () => {
    for (const p of ["model-info", "model-comparison", "capabilities"]) expect((await request(app).get(`/api/v1/${p}`)).status).toBe(200);
  });
  test("red flag -> urgent safety + consent/family fields work end to end", async () => {
    const r = await request(app).post("/api/v1/assess").send({ answers: a, redFlags: { pus_or_fluid: true }, consentToStore: false,
      familyHistory: { relatives: [{ relation: "mother", condition: "psoriasis", answer: "yes" }] } });
    expect(r.status).toBe(200);
    expect(r.body.safety.level).toBe("urgent_review");
    expect(r.body.familyHistoryAnalysis.conditions.psoriasis.closeRelativeAffected).toBe(true);
    expect(r.headers["x-history-saved"]).toBe("false");
  });
  test("family-history analysis works end to end through the Node gateway", async () => {
    const r = await request(app).post("/api/v1/family-history-analysis").send({
      familyHistory: { psoriasis: "yes", relatives: [{ relation: "mother", condition: "psoriasis", answer: "yes" }] },
    });
    expect(r.status).toBe(200);
    expect(r.body.status).toBe("descriptive_only");
    expect(r.body.result.conditions.psoriasis.status).toBe("family_history_reported");
    expect(r.body.result.conditions.psoriasis.closeRelativeAffected).toBe(true);
  });
  test("hereditary assessment is qualitative only end to end through the Node gateway", async () => {
    const r = await request(app).post("/api/v1/hereditary-risk").send({
      familyHistory: { psoriasis: "yes", eczema: "no", vitiligo: "not_sure" },
    });
    expect(r.status).toBe(200);
    expect(r.body.status).toBe("qualitative_only");
    expect(r.body.assessments.psoriasis.status).toBe("family_history_reported");
    expect(r.body.assessments.psoriasis.riskPercentage).toBeNull();
    expect(r.body.assessments.psoriasis.riskEstimateAvailable).toBe(false);
    expect(r.body.assessments.vitiligo.status).toBe("insufficient_information");
  });
});

// Optional history. Only called after the user explicitly consented (consentToStore:true). Failures are logged and swallowed: database problems never change an API response.
const makePredictionModel = require("../models/PredictionRecord");
const ModelMetadataRecord = require("../models/ModelMetadataRecord");

function createHistory({ db, config }) {
  const enabled = () => db.isReady();
  return {
    async recordAssessment(requestBody, ml) {
      if (!enabled()) return false;
      try {
        const Rec = makePredictionModel(config.historyTtlDays);
        const doc = {
          endpoint: "assess", topCondition: ml.topCondition?.condition, answeredCount: ml.answeredCount,
          scores: Object.fromEntries((ml.predictions || []).map((p) => [p.condition, p.modelScore])),
          modelName: ml.model?.name, modelVersion: ml.model?.version,
          safetyLevel: ml.safety?.level, consent: true,
        };
        if (config.storeInputs) { doc.answers = requestBody.answers; doc.redFlags = requestBody.redFlags; doc.familyHistory = requestBody.familyHistory; }
        await Rec.create(doc);
        return true;
      } catch (err) { console.error("history write failed:", err.message); return false; }
    },
    async list(limit = 20) {
      if (!enabled()) return null;
      return makePredictionModel(config.historyTtlDays).find().sort({ createdAt: -1 }).limit(Math.min(limit, 100)).lean();
    },
    async syncModelMetadata(ml) {
      if (!enabled()) return false;
      try {
        const md = await ml.get("/v1/model-info");
        if (md.status !== 200) return false;
        const cmp = await ml.get("/v1/model-comparison");
        const version = md.data.model_version;
        await ModelMetadataRecord.updateOne({ kind: "model_metadata", version }, { payload: md.data, syncedAt: new Date() }, { upsert: true });
        if (cmp.status === 200)
          await ModelMetadataRecord.updateOne({ kind: "evaluation_run", version }, { payload: cmp.data, syncedAt: new Date() }, { upsert: true });
        return true;
      } catch (err) { console.error("metadata sync failed:", err.message); return false; }
    },
  };
}
module.exports = { createHistory };

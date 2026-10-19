// One record per /assess call: only the model's scores. Records exist only with user consent. Answers are stored ONLY if STORE_INPUTS=true. Records expire (TTL).
const mongoose = require("mongoose");
module.exports = (ttlDays) => {
  if (mongoose.models.PredictionRecord) return mongoose.models.PredictionRecord;
  const schema = new mongoose.Schema({
    endpoint: { type: String, required: true },
    topCondition: String,
    scores: { type: Map, of: Number },
    answeredCount: Number,
    modelName: String, modelVersion: String,
    safetyLevel: String, consent: Boolean,
    redFlags: { type: mongoose.Schema.Types.Mixed, default: undefined },
    familyHistory: { type: mongoose.Schema.Types.Mixed, default: undefined },
    answers: { type: mongoose.Schema.Types.Mixed, default: undefined },
    createdAt: { type: Date, default: Date.now },
  });
  schema.index({ createdAt: 1 }, { expireAfterSeconds: ttlDays * 86400 });
  return mongoose.model("PredictionRecord", schema);
};

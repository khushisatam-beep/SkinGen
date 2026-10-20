const mongoose = require("mongoose");

module.exports = () => {
  if (mongoose.models.PredictionRecord) return mongoose.models.PredictionRecord;
  const schema = new mongoose.Schema({
    endpoint: { type: String, required: true },
    userId: { type: mongoose.Schema.Types.ObjectId, ref: "SkinGenUser", default: undefined },
    topCondition: String,
    scores: { type: Map, of: Number },
    answeredCount: Number,
    modelName: String,
    modelVersion: String,
    safetyLevel: String,
    consent: { type: Boolean, required: true },
    user: { name: String },
    redFlags: { type: mongoose.Schema.Types.Mixed, default: undefined },
    familyHistory: { type: mongoose.Schema.Types.Mixed, default: undefined },
    answers: { type: mongoose.Schema.Types.Mixed, default: undefined },
    screeningResult: { type: mongoose.Schema.Types.Mixed, required: true },
    createdAt: { type: Date, default: Date.now },
  }, { collection: "predictionrecords" });
  schema.index({ userId: 1, createdAt: -1 });
  return mongoose.model("PredictionRecord", schema);
};

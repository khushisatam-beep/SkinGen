// Snapshot of the ML service's model metadata / comparison report (no personal data).
const mongoose = require("mongoose");
const schema = new mongoose.Schema({
  kind: { type: String, enum: ["model_metadata", "evaluation_run"], required: true },
  version: { type: String, required: true },
  payload: mongoose.Schema.Types.Mixed,
  syncedAt: { type: Date, default: Date.now },
});
schema.index({ kind: 1, version: 1 }, { unique: true });
module.exports = mongoose.models.ModelMetadataRecord || mongoose.model("ModelMetadataRecord", schema);

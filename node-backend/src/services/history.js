const mongoose = require("mongoose");
const makePredictionModel = require("../models/PredictionRecord");
const ModelMetadataRecord = require("../models/ModelMetadataRecord");

function createHistory({ db, config }) {
  const enabled = () => db.isReady();
  const recordModel = () => makePredictionModel();
  return {
    async recordAssessment(requestBody, result) {
      if (!enabled()) return null;
      try {
        const doc = {
          endpoint: "assess",
          userId: requestBody.userId,
          topCondition: result.topCondition?.condition,
          answeredCount: result.answeredCount,
          scores: Object.fromEntries((result.predictions || []).map((prediction) => [prediction.condition, prediction.modelScore])),
          modelName: result.model?.name,
          modelVersion: result.model?.version,
          user: { name: requestBody.user?.name || "" },
          safetyLevel: result.safety?.level,
          consent: true,
          answers: requestBody.answers,
          redFlags: requestBody.redFlags,
          familyHistory: requestBody.familyHistory,
          screeningResult: result,
        };
        const saved = await recordModel().create(doc);
        return String(saved._id);
      } catch (error) {
        console.error("assessment write failed:", error.message);
        return null;
      }
    },

    async list(limit = 100) {
      if (!enabled()) return null;
      return recordModel().find().sort({ createdAt: -1 }).limit(Math.min(Math.max(Number(limit) || 100, 1), 1000)).lean();
    },

    async countRecords() {
      if (!enabled()) return null;
      return recordModel().countDocuments();
    },

    async listForUser(userId, limit = 500) {
      if (!enabled()) return null;
      return recordModel().find({ userId }).sort({ createdAt: -1 }).limit(Math.min(Math.max(Number(limit) || 200, 1), 500)).lean();
    },

    async anonymizeUser(userId, name, emails = []) {
      if (!enabled()) return false;
      try {
        const emailList = (Array.isArray(emails) ? emails : [emails]).filter(Boolean);
        await recordModel().updateMany(
          { $or: [{ userId: new mongoose.Types.ObjectId(userId) }, ...emailList.map((email) => ({ "user.email": email }))] },
          { $set: { user: { name: String(name || "Deleted user") } }, $unset: { userId: 1 } }
        );
        return true;
      } catch (error) {
        console.error("account report anonymization failed:", error.message);
        return false;
      }
    },

    async deleteRecord(recordId, userId = null) {
      if (!enabled()) return null;
      if (!mongoose.isValidObjectId(recordId)) return false;
      try {
        const filter = { _id: recordId };
        if (userId) filter.userId = userId;
        const result = await recordModel().deleteOne(filter);
        return result.deletedCount === 1;
      } catch (error) {
        console.error("assessment deletion failed:", error.message);
        return false;
      }
    },

    async removeExpiryIndexes() {
      if (!enabled()) return false;
      try {
        const indexes = await recordModel().collection.indexes();
        for (const index of indexes) {
          if (index.expireAfterSeconds !== undefined) await recordModel().collection.dropIndex(index.name);
        }
        return true;
      } catch (error) {
        if (error.codeName === "NamespaceNotFound") return true;
        console.error("assessment retention migration failed:", error.message);
        return false;
      }
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
      } catch (error) {
        console.error("metadata sync failed:", error.message);
        return false;
      }
    },
  };
}

module.exports = { createHistory };

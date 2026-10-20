const mongoose = require("mongoose");

module.exports = () => {
  if (mongoose.models.SkinGenUser) return mongoose.models.SkinGenUser;
  const schema = new mongoose.Schema({
    name: { type: String, required: true, trim: true, maxlength: 120 },
    email: { type: String, required: true, unique: true, lowercase: true, trim: true, maxlength: 254 },
    emailHistory: { type: [String], default: [], select: false },
    phone: { type: String, default: "", trim: true, maxlength: 40 },
    age: { type: Number, min: 1, max: 120, default: null },
    gender: { type: String, default: "", trim: true, maxlength: 60 },
    passwordSalt: { type: String, required: true, select: false },
    passwordHash: { type: String, required: true, select: false },
    lastActiveAt: { type: Date, default: Date.now },
  }, { timestamps: true, collection: "users" });
  return mongoose.model("SkinGenUser", schema);
};

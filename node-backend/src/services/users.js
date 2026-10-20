const crypto = require("crypto");
const mongoose = require("mongoose");
const { promisify } = require("util");
const makeUserModel = require("../models/User");
const { createUserToken } = require("../middleware/auth");

const scrypt = promisify(crypto.scrypt);
const failure = (status, code, message) => Object.assign(new Error(message), { status, code });
const emailPattern = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

async function passwordDigest(password, salt) {
  return (await scrypt(String(password), salt, 64)).toString("hex");
}

function publicUser(user) {
  return {
    id: String(user._id),
    name: user.name,
    email: user.email,
    phone: user.phone || "",
    age: user.age ?? "",
    gender: user.gender || "",
    createdAt: user.createdAt,
  };
}

function createUsers({ db, config, history }) {
  const model = () => makeUserModel();
  const ensureReady = () => {
    if (!db.isReady()) throw failure(503, "database_unavailable", "Account storage is unavailable. Please try again when the database is online.");
  };

  return {
    async register(input) {
      ensureReady();
      const name = String(input.name || "").trim();
      const email = String(input.email || "").trim().toLowerCase();
      const password = String(input.password || "");
      if (!name || name.length > 120) throw failure(400, "invalid_name", "Enter a name up to 120 characters long.");
      if (!emailPattern.test(email) || email.length > 254) throw failure(400, "invalid_email", "Enter a valid email address.");
      if (password.length < 8 || password.length > 128) throw failure(400, "invalid_password", "Password must be between 8 and 128 characters.");
      const phone = String(input.phone || "").trim();
      const gender = String(input.gender || "").trim();
      if (phone.length > 40) throw failure(400, "invalid_phone", "Phone number must be 40 characters or fewer.");
      if (gender.length > 60) throw failure(400, "invalid_gender", "Gender must be 60 characters or fewer.");
      if (await model().exists({ email })) throw failure(409, "email_in_use", "An account with this email already exists.");
      const salt = crypto.randomBytes(16).toString("hex");
      const passwordHash = await passwordDigest(password, salt);
      const age = input.age === "" || input.age == null ? null : Number(input.age);
      if (age != null && (!Number.isInteger(age) || age < 1 || age > 120)) throw failure(400, "invalid_age", "Age must be a whole number between 1 and 120.");
      let user;
      try {
        user = await model().create({ name, email, phone, age, gender, passwordSalt: salt, passwordHash });
      } catch (error) {
        if (error.code === 11000) throw failure(409, "email_in_use", "An account with this email already exists.");
        throw error;
      }
      return { user: publicUser(user), token: createUserToken(user._id, config) };
    },

    async authenticate(emailInput, passwordInput) {
      ensureReady();
      const email = String(emailInput || "").trim().toLowerCase();
      const user = await model().findOne({ email }).select("+passwordSalt +passwordHash");
      const salt = user?.passwordSalt || "skingen-invalid-login-salt";
      const actual = await passwordDigest(String(passwordInput || ""), salt);
      const expected = user?.passwordHash || "0".repeat(128);
      const valid = crypto.timingSafeEqual(Buffer.from(actual, "hex"), Buffer.from(expected, "hex"));
      if (!user || !valid) throw failure(401, "invalid_credentials", "The email or password is incorrect.");
      user.lastActiveAt = new Date();
      await user.save();
      return { user: publicUser(user), token: createUserToken(user._id, config) };
    },

    async getById(id) {
      ensureReady();
      const user = await model().findById(id).lean();
      if (!user) throw failure(404, "account_not_found", "This account no longer exists.");
      return publicUser(user);
    },

    async updateProfile(id, input) {
      ensureReady();
      const user = await model().findById(id).select("+emailHistory");
      if (!user) throw failure(404, "account_not_found", "This account no longer exists.");
      if (Object.hasOwn(input, "name")) {
        const name = String(input.name || "").trim();
        if (!name || name.length > 120) throw failure(400, "invalid_name", "Enter a name up to 120 characters long.");
        user.name = name;
      }
      if (Object.hasOwn(input, "email")) {
        const email = String(input.email || "").trim().toLowerCase();
        if (!emailPattern.test(email) || email.length > 254) throw failure(400, "invalid_email", "Enter a valid email address.");
        const existing = await model().exists({ email, _id: { $ne: user._id } });
        if (existing) throw failure(409, "email_in_use", "An account with this email already exists.");
        if (email !== user.email) user.emailHistory.push(user.email);
        user.email = email;
      }
      if (Object.hasOwn(input, "phone")) {
        const phone = String(input.phone || "").trim();
        if (phone.length > 40) throw failure(400, "invalid_phone", "Phone number must be 40 characters or fewer.");
        user.phone = phone;
      }
      if (Object.hasOwn(input, "age")) {
        const age = input.age === "" || input.age == null ? null : Number(input.age);
        if (age != null && (!Number.isInteger(age) || age < 1 || age > 120)) throw failure(400, "invalid_age", "Age must be a whole number between 1 and 120.");
        user.age = age;
      }
      if (Object.hasOwn(input, "gender")) {
        const gender = String(input.gender || "").trim();
        if (gender.length > 60) throw failure(400, "invalid_gender", "Gender must be 60 characters or fewer.");
        user.gender = gender;
      }
      await user.save();
      return publicUser(user);
    },

    async changePassword(id, currentPassword, newPassword) {
      ensureReady();
      const user = await model().findById(id).select("+passwordSalt +passwordHash");
      if (!user) throw failure(404, "account_not_found", "This account no longer exists.");
      const actual = await passwordDigest(String(currentPassword || ""), user.passwordSalt);
      const matches = crypto.timingSafeEqual(Buffer.from(actual, "hex"), Buffer.from(user.passwordHash, "hex"));
      if (!matches) throw failure(401, "invalid_current_password", "The current password is incorrect.");
      if (String(newPassword || "").length < 8 || String(newPassword).length > 128) throw failure(400, "invalid_password", "New password must be between 8 and 128 characters.");
      user.passwordSalt = crypto.randomBytes(16).toString("hex");
      user.passwordHash = await passwordDigest(newPassword, user.passwordSalt);
      await user.save();
    },

    async deleteAccount(id) {
      ensureReady();
      if (!mongoose.isValidObjectId(id)) throw failure(404, "account_not_found", "This account no longer exists.");
      const user = await model().findById(id).select("name email +emailHistory");
      if (!user) throw failure(404, "account_not_found", "This account no longer exists.");
      const scrubbed = await history.anonymizeUser(String(user._id), user.name, [user.email, ...(user.emailHistory || [])]);
      if (!scrubbed) throw failure(503, "account_delete_incomplete", "Saved reports could not be detached from the account. Nothing was deleted; please retry.");
      await model().deleteOne({ _id: user._id });
    },

    async listAdmin(limit = 500) {
      ensureReady();
      const [total, users] = await Promise.all([
        model().countDocuments(),
        model().find({}, { name: 1, email: 1, phone: 1, age: 1, gender: 1, createdAt: 1, lastActiveAt: 1, updatedAt: 1 }).sort({ createdAt: -1 }).limit(Math.min(Math.max(Number(limit) || 500, 1), 1000)).lean(),
      ]);
      return { total, users: users.map((user) => ({
        id: String(user._id), name: user.name, email: user.email, phone: user.phone || "",
        age: user.age ?? null, gender: user.gender || "", createdAt: user.createdAt,
        lastActiveAt: user.lastActiveAt || user.updatedAt || user.createdAt,
      })) };
    },
  };
}

module.exports = { createUsers, publicUser };

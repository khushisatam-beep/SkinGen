// MongoDB connection for user accounts and consented screening reports. Never throws at startup; status is reported by /health.
const mongoose = require("mongoose");

function createDb(config) {
  let status = config.enableHistory ? "connecting" : "disabled";
  let lastError = null;

  async function connect() {
    if (!config.enableHistory) return;
    if (!config.mongoUri) { status = "unavailable"; lastError = "MONGODB_URI not set"; return; }
    mongoose.set("bufferCommands", false); // fail fast instead of queueing when disconnected
    mongoose.connection.on("connected", () => { status = "connected"; lastError = null; });
    mongoose.connection.on("disconnected", () => { status = "unavailable"; });
    try {
      await mongoose.connect(config.mongoUri, { serverSelectionTimeoutMS: config.mongoTimeoutMs });
      status = "connected";
    } catch (err) {
      status = "unavailable"; lastError = err.message;
      console.error("MongoDB connection failed (history disabled until it recovers):", err.message);
    }
  }
  return {
    connect,
    getStatus: () => ({ status, error: lastError }),
    isReady: () => config.enableHistory && mongoose.connection.readyState === 1,
    close: () => mongoose.disconnect().catch(() => {}),
  };
}
module.exports = { createDb };

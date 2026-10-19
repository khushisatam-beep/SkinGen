const http = require("http");
const { createApp } = require("../src/app");
const { createMlClient } = require("../src/services/mlClient");
const { createDb } = require("../src/services/db");
const { createHistory } = require("../src/services/history");

// A tiny fake ML service so Node's real HTTP client path is exercised.
function startFakeMl(handler) {
  return new Promise((resolve) => {
    const calls = [];
    const server = http.createServer((req, res) => {
      let raw = "";
      req.on("data", (c) => (raw += c));
      req.on("end", () => {
        const body = raw ? JSON.parse(raw) : null;
        calls.push({ method: req.method, url: req.url, body });
        const out = handler({ method: req.method, url: req.url, body }) || { status: 200, json: {} };
        res.writeHead(out.status || 200, { "Content-Type": "application/json" });
        res.end(JSON.stringify(out.json));
      });
    });
    server.listen(0, "127.0.0.1", () => resolve({ server, calls, url: `http://127.0.0.1:${server.address().port}`,
      close: () => new Promise((r) => server.close(r)) }));
  });
}

function buildApp({ mlUrl, historyOverride, configOverride = {} }) {
  const config = { enableHistory: false, mongoUri: "", mongoTimeoutMs: 500, storeInputs: false, historyTtlDays: 30, corsOrigin: "", adminApiKey: "", rateLimitPerMin: 0, trustProxy: "", ...configOverride };
  const ml = createMlClient({ baseUrl: mlUrl, timeoutMs: 1500 });
  const db = createDb(config);
  const history = historyOverride || createHistory({ db, config });
  return { app: createApp({ ml, db, history, config }), db, ml, config };
}
module.exports = { startFakeMl, buildApp };

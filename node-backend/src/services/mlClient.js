// Thin HTTP client for the FastAPI ML service. Uses Node 20's built-in fetch.
class MlUnavailableError extends Error {
  constructor(message, timeout = false) { super(message); this.name = "MlUnavailableError"; this.timeout = timeout; }
}

function createMlClient({ baseUrl, timeoutMs = 10000 }) {
  async function call(method, path, body) {
    const ctrl = new AbortController();
    const timer = setTimeout(() => ctrl.abort(), timeoutMs);
    try {
      const res = await fetch(baseUrl + path, {
        method,
        headers: body ? { "Content-Type": "application/json" } : undefined,
        body: body ? JSON.stringify(body) : undefined,
        signal: ctrl.signal,
      });
      const text = await res.text();
      let data;
      try { data = text ? JSON.parse(text) : null; } catch { data = { error: { code: "bad_ml_response", message: "ML service returned non-JSON" } }; }
      return { status: res.status, data };
    } catch (err) {
      throw new MlUnavailableError(err.name === "AbortError" ? "ML service timed out" : `ML service unreachable: ${err.cause?.code || err.message}`,
        err.name === "AbortError");
    } finally { clearTimeout(timer); }
  }
  return { get: (p) => call("GET", p), post: (p, b) => call("POST", p, b) };
}

module.exports = { createMlClient, MlUnavailableError };

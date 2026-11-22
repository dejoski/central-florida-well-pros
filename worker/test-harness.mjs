// Local test harness for the lead Worker — no wrangler/miniflare needed.
// Mocks KV with a Map and calls handleRequest directly.
// Run (when execution in this repo is approved):  node worker/test-harness.mjs
import { handleRequest } from "./index.js";

class MockKV {
  constructor() { this.map = new Map(); }
  async get(k) { return this.map.has(k) ? this.map.get(k) : null; }
  async put(k, v) { this.map.set(k, String(v)); }
  async list({ prefix = "", limit = 1000 } = {}) {
    const keys = [...this.map.keys()].filter((k) => k.startsWith(prefix)).slice(0, limit).map((name) => ({ name }));
    return { keys, list_complete: true };
  }
}

const env = { WELL_LEADS: new MockKV(), OWNER_TOKEN: "test-owner-token", ALLOWED_ORIGIN: "https://dejoski.github.io" };
const base = "https://worker.test";
let failures = 0;
async function check(label, req, expectStatus, assert) {
  const res = await handleRequest(req, env);
  const body = await res.json().catch(() => ({}));
  const ok = res.status === expectStatus && (!assert || assert(body, res));
  console.log(`${ok ? "PASS" : "FAIL"} ${label} -> ${res.status} ${JSON.stringify(body).slice(0, 220)}`);
  if (!ok) failures++;
}
const post = (obj) => new Request(`${base}/leads`, { method: "POST", headers: { "Content-Type": "application/json", Origin: "https://dejoski.github.io" }, body: JSON.stringify(obj) });

await check("GET /health", new Request(`${base}/health`), 200, (b) => b.ok === true && b.service === "central-florida-well-pros");
await check("POST /leads valid", post({ name: "Test Person", phone: "407-555-0123", city: "Poinciana", service: "Well pump replacement", urgency: "This week", message: "Low pressure", page: "/", source: "central-florida-well-pros" }), 201, (b) => b.ok === true && b.count === 1 && !!b.id);
await check("POST /leads invalid (missing phone/city/service)", post({ name: "X" }), 400, (b) => b.ok === false && Array.isArray(b.errors) && b.errors.length >= 3);
await check("GET /leads/count", new Request(`${base}/leads/count`), 200, (b) => b.count === 1);
await check("GET /leads no auth", new Request(`${base}/leads`), 401, (b) => b.ok === false);
await check("GET /leads owner auth", new Request(`${base}/leads`, { headers: { Authorization: "Bearer test-owner-token" } }), 200, (b) => b.ok === true && b.leads.length === 1 && b.leads[0].city === "Poinciana");
await check("OPTIONS preflight CORS", new Request(`${base}/leads`, { method: "OPTIONS", headers: { Origin: "https://dejoski.github.io" } }), 204, (_b, res) => res.headers.get("Access-Control-Allow-Origin") === "https://dejoski.github.io");

console.log(failures === 0 ? "ALL TESTS PASSED" : `${failures} TEST(S) FAILED`);
process.exit(failures === 0 ? 0 : 1);

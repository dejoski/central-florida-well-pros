// Central Florida Well Pros — lead Worker (single file, no dependencies).
// Bindings (see wrangler.toml):
//   WELL_LEADS   KV namespace — lead records + meta:lead_count
//   OWNER_TOKEN  secret (wrangler secret put OWNER_TOKEN) — owner read auth
// Vars:
//   ALLOWED_ORIGIN       e.g. https://dejoski.github.io
//   CUSTOM_DOMAIN_ORIGIN optional later, e.g. https://centralfloridawellpros.com
//
// Routes:
//   POST /leads        validate + store lead, increment count -> 201 {ok,id,count}
//   GET  /leads/count  public count only, no PII              -> {ok,count}
//   GET  /leads        owner-only (Bearer OWNER_TOKEN)        -> {ok,count,leads}
//   GET  /health       -> {ok:true, service:"central-florida-well-pros"}

const SERVICE = "central-florida-well-pros";
const COUNT_KEY = "meta:lead_count";
const MAX_FIELD = 2000;

function allowedOrigins(env) {
  return [
    "https://dejoski.github.io",
    env.ALLOWED_ORIGIN,
    env.CUSTOM_DOMAIN_ORIGIN, // placeholder for a future custom domain
    "https://www.centralfloridawellpros.com",
    "https://centralfloridawellpros.com",
  ].filter(Boolean);
}

function corsHeaders(request, env) {
  const origin = request.headers.get("Origin") || "";
  const allow = allowedOrigins(env).includes(origin)
    ? origin
    : "https://dejoski.github.io";
  return {
    "Access-Control-Allow-Origin": allow,
    "Access-Control-Allow-Methods": "GET, POST, OPTIONS",
    "Access-Control-Allow-Headers": "Content-Type, Authorization",
    "Access-Control-Max-Age": "86400",
    Vary: "Origin",
  };
}

function json(request, env, status, body) {
  return new Response(JSON.stringify(body), {
    status,
    headers: { "Content-Type": "application/json", ...corsHeaders(request, env) },
  });
}

function clean(value) {
  return typeof value === "string" ? value.trim().slice(0, MAX_FIELD) : "";
}

function validateLead(d) {
  const errors = [];
  const lead = {
    name: clean(d.name),
    phone: clean(d.phone),
    city: clean(d.city),
    service: clean(d.service),
    urgency: clean(d.urgency),
    message: clean(d.message),
    page: clean(d.page),
    source: clean(d.source) || SERVICE,
  };
  if (lead.name.length < 2) errors.push("name is required");
  if (!/^[0-9()+.\-\s]{7,}$/.test(lead.phone) || (lead.phone.match(/\d/g) || []).length < 7)
    errors.push("a valid phone is required");
  if (!lead.city) errors.push("city is required");
  if (!lead.service) errors.push("service is required");
  return { lead, errors };
}

async function getCount(env) {
  const raw = await env.WELL_LEADS.get(COUNT_KEY);
  const n = parseInt(raw, 10);
  return Number.isFinite(n) && n > 0 ? n : 0;
}

export async function handleRequest(request, env) {
  const url = new URL(request.url);
  const path = url.pathname.replace(/\/+$/, "") || "/";

  if (request.method === "OPTIONS") {
    return new Response(null, { status: 204, headers: corsHeaders(request, env) });
  }

  if (request.method === "GET" && path === "/health") {
    return json(request, env, 200, { ok: true, service: SERVICE });
  }

  if (request.method === "GET" && path === "/leads/count") {
    if (!env.WELL_LEADS) return json(request, env, 503, { ok: false, error: "storage not configured" });
    return json(request, env, 200, { ok: true, count: await getCount(env) });
  }

  if (request.method === "POST" && path === "/leads") {
    if (!env.WELL_LEADS) return json(request, env, 503, { ok: false, error: "storage not configured" });
    let data;
    try {
      data = await request.json();
    } catch {
      return json(request, env, 400, { ok: false, errors: ["invalid JSON body"] });
    }
    const { lead, errors } = validateLead(data || {});
    if (errors.length) return json(request, env, 400, { ok: false, errors });

    const ts = Date.now();
    const id =
      typeof crypto !== "undefined" && crypto.randomUUID
        ? crypto.randomUUID()
        : `${ts}-${Math.random().toString(36).slice(2, 10)}`;
    const record = { id, ...lead, ts, receivedAt: new Date(ts).toISOString() };
    await env.WELL_LEADS.put(`lead:${ts}:${id}`, JSON.stringify(record));
    const count = (await getCount(env)) + 1;
    await env.WELL_LEADS.put(COUNT_KEY, String(count));
    return json(request, env, 201, { ok: true, id, count });
  }

  if (request.method === "GET" && path === "/leads") {
    if (!env.OWNER_TOKEN) return json(request, env, 503, { ok: false, error: "owner auth not configured" });
    if (request.headers.get("Authorization") !== `Bearer ${env.OWNER_TOKEN}`) {
      return json(request, env, 401, { ok: false, error: "unauthorized" });
    }
    if (!env.WELL_LEADS) return json(request, env, 503, { ok: false, error: "storage not configured" });
    const limit = Math.min(Math.max(parseInt(url.searchParams.get("limit"), 10) || 50, 1), 200);
    const listed = await env.WELL_LEADS.list({ prefix: "lead:", limit: 1000 });
    const leads = [];
    for (const key of listed.keys) {
      const raw = await env.WELL_LEADS.get(key.name);
      if (raw) {
        try { leads.push(JSON.parse(raw)); } catch { /* skip corrupt record */ }
      }
    }
    leads.sort((a, b) => (b.ts || 0) - (a.ts || 0));
    return json(request, env, 200, { ok: true, count: await getCount(env), leads: leads.slice(0, limit) });
  }

  return json(request, env, 404, { ok: false, error: "not found" });
}

export default {
  fetch: (request, env) => handleRequest(request, env),
};

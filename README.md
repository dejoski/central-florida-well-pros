# Central Florida Well Pros
Dedicated well lead-gen site (Astro, GitHub Pages). Brand and leads are completely separate from Osceola Sod / the father-in-law's business — leads are Dejan's to sell to well companies.

## Lead counting / funnel
- Every quote form submit validates name/phone/city/service, stores the lead in browser localStorage under `cfwp_leads`, increments `cfwp_lead_count`, pushes a `lead_submit` event to `window.dataLayer`, and attempts a POST to `/central-florida-well-pros/api/leads` (graceful failure on static GitHub Pages).
- First-party tracking (`public/track.js`): pageview events to dataLayer + localStorage `cfwp_events`, beacon-ready.
- Owner funnel: open the live site, submit a test lead, then in browser console read `localStorage.getItem('cfwp_lead_count')` and `cfwp_leads`.
- Server endpoint (code ready, not yet deployed): `worker/` contains a Cloudflare Worker + KV (`WELL_LEADS`) with POST /leads, GET /leads/count, owner-only GET /leads, GET /health. The form's endpoint is configured in ONE place — `LEAD_ENDPOINT` in `src/config.ts` (default `""` = local-only; stored leads carry an `endpoint_ok` flag). Deploy steps: `worker/DEPLOY.md`. Blocker: the agent-controlled Cloudflare account is pending Muse Mail mailbox creation (Pest 🐜 chat).
## Build/deploy
npm install && npm run build — Pages served from gh-pages branch.

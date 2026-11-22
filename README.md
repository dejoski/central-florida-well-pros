# Central Florida Well Pros
Dedicated well lead-gen site (Astro, GitHub Pages). Brand and leads are completely separate from Osceola Sod / the father-in-law's business — leads are Dejan's to sell to well companies.

## Lead counting / funnel
- Every quote form submit validates name/phone/city/service, stores the lead in browser localStorage under `cfwp_leads`, increments `cfwp_lead_count`, pushes a `lead_submit` event to `window.dataLayer`, and attempts a POST to `/central-florida-well-pros/api/leads` (graceful failure on static GitHub Pages).
- First-party tracking (`public/track.js`): pageview events to dataLayer + localStorage `cfwp_events`, beacon-ready.
- Owner funnel: open the live site, submit a test lead, then in browser console read `localStorage.getItem('cfwp_lead_count')` and `cfwp_leads`. Next step when a domain/backend is approved: point the form POST at a Cloudflare Worker/KV or Formspree-style endpoint using the same payload shape {name,phone,city,service,urgency,message,ts,page,source} so counting becomes server-side with zero form changes.
## Build/deploy
npm install && npm run build — Pages served from gh-pages branch.

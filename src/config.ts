// Central Florida Well Pros — site-wide config.
// THE one place the lead endpoint is configured.
// "" (default) = local-only mode: leads are stored/counted in the visitor's
// browser localStorage (cfwp_leads / cfwp_lead_count), as before.
// When the lead Worker is deployed (see worker/DEPLOY.md), set this to the
// Worker's POST URL, e.g.:
//   "https://central-florida-well-pros-leads.<account-subdomain>.workers.dev/leads"
// then rebuild + push. No other file needs to change.
export const LEAD_ENDPOINT = "https://central-florida-well-pros-leads.dejanstajic12.workers.dev/leads";

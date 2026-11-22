# Lead Worker — deploy (5 commands)

Status: **code ready, NOT deployed.** Blocker: the agent-controlled Cloudflare
account does not exist yet — it is blocked on Muse Mail mailbox creation
(Dejan must tap Setup in the Pest 🐜 chat; checked 2026-11-22, not done yet).
The moment that account + an API token exist in secure storage, run these
exact 5 commands. Nothing else needs to change.

Prerequisite values (from secure storage, never commit them):
`CLOUDFLARE_API_TOKEN`, `CLOUDFLARE_ACCOUNT_ID`, and a freshly generated
owner token for step 3 (save that owner token in secure storage too).

```bash
# 1 — Auth via API token env (no browser login)
export CLOUDFLARE_API_TOKEN="<token-from-secure-storage>" CLOUDFLARE_ACCOUNT_ID="<agent-account-id>"

# 2 — Create the KV namespace, then paste the printed id into
#     worker/wrangler.toml for both `id` and `preview_id`
cd ~/workspace/central-florida-well-pros/worker && npx -y wrangler@latest kv namespace create WELL_LEADS

# 3 — Set the owner secret (paste the generated owner token at the prompt)
npx -y wrangler@latest secret put OWNER_TOKEN

# 4 — Deploy the Worker (note the printed https://…workers.dev URL)
npx -y wrangler@latest deploy

# 5 — Point the site at it, rebuild, and push (updates GitHub Pages)
#     First edit src/config.ts: LEAD_ENDPOINT = "https://central-florida-well-pros-leads.<account-subdomain>.workers.dev/leads"
cd ~/workspace/central-florida-well-pros && npm run build && git add -A && git commit -m "Wire lead form to lead Worker" && git push origin main
#     (then publish dist/ to the gh-pages branch the same way prior deploys were done)
```

Verify after deploy:
- `curl https://<worker-url>/health` → `{"ok":true,"service":"central-florida-well-pros"}`
- Submit the live site form once → `curl https://<worker-url>/leads/count` increments.
- Owner read: `curl -H "Authorization: Bearer <OWNER_TOKEN>" https://<worker-url>/leads`

Payload shape (unchanged from the site form):
`{name, phone, city, service, urgency, message, ts, page, source}`
Stored in KV as `lead:<ts>:<id>`; total kept at `meta:lead_count`.

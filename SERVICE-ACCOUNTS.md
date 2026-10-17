# Service Accounts — Runtime Injection Pattern

## Principle

Every external service gets its **own scoped service account**. Never reuse the
personal GitHub token. Tokens are injected at runtime — never committed.

## Injection Layers

1. **GitHub Secrets** — wired into `.github/workflows/agents.yml` as
   `${{ secrets.* }}`. Available to every job run.
2. **Environment variables** — set on the host / Vercel project. Read by
   `runtime/env-loader.js` which merges `.env` with `process.env`
   (process.env wins).
3. **MCP connectors** — per-service connectors in the Grok/Cursor UI with
   explicit scopes. Finest-grained control: each session only sees what
   its connector grants.
4. **Repository dispatch** — external systems can trigger a run with
   `gh api repos/s-os-agency/SS-agentic-ai-factory/dispatches -f event_type=agent-dispatch`
   passing context in the payload.

## Adding a New Service Account

1. Create the account on the provider with least-privilege scopes only.
2. Add the key to `.env.example` (empty, documented).
3. Add `${{ secrets.SERVICE_NAME_TOKEN }}` to the workflow env block.
4. Reference it in the workflow step or in `runtime/env-loader.js`
   `requiredKeys` for the agent that needs it.
5. Never log the value. Log only presence/absence.

## Current Slots

| Slot | Provider | Scopes |
|------|----------|--------|
| GH_SERVICE_TOKEN | GitHub | repo, notifications, read:org |
| NOTION_SERVICE_TOKEN | Notion | read/write pages |
| VERCEL_SERVICE_TOKEN | Vercel | project deploy |
| LINEAR_SERVICE_TOKEN | Linear | issues, projects |
| GAMMA_SERVICE_TOKEN | Gamma | decks |
| FIGMA_SERVICE_TOKEN | Figma | files read |
| CANVA_SERVICE_TOKEN | Canva | designs |
| COINBASE_SERVICE_TOKEN | Coinbase | trading read |
| HYPERFRAMES_SERVICE_TOKEN | HyperFrames | avatar renders |

## Dispatch Types

- `agent-dispatch` — run agents for a specific task
- `service-account-update` — a credential rotated; re-verify
- `bot-ops-check` — status sweep across assigned bots

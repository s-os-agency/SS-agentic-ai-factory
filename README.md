# S/ Agentic AI Factory

Execution-first agent factory by **S/Agency**. Agents run real workflows, and every claim is backed by logs.

## Principles

- Real execution only: no simulated runs.
- No fake metrics: numbers come from actual runs.
- Logs as evidence: if it isn't logged, it didn't happen.
- **S/** standardized by core.

## Repository map

| Path | Purpose |
| --- | --- |
| `agents/` | Agent definitions |
| `workflows/` | Workflow definitions the agents execute |
| `runtime/` | Execution runtime |
| `api/` | Serverless API endpoints (Vercel) |
| `control-panel/` | Operator control panel |
| `telegram-mini-app/` | Telegram Mini App client |
| `showcase/` | Showcase pages |
| `data/` | Data and run records |
| `vps/` | VPS-side services |
| `index.html` | Landing page |
| `vercel.json` | Vercel routing and config |
| `AGENTS.md`, `.Rules` | Rules and conventions for agents and contributors |

## Getting started

1. Copy `.env.example` to `.env` and fill in the values.
2. Install dependencies: `npm install`.
3. Deploy: push to `main`. Vercel builds and deploys automatically.

## Contributing

Read `AGENTS.md` and `.Rules` before changing agents or workflows. Keep changes small and log what ran.

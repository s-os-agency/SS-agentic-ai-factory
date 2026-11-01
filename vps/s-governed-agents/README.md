# Governed Agent System

This folder contains the VPS-ready system package for the governed agent control panel.

## Purpose

Create a real runnable starter system instead of a placeholder scaffold.

## System services

- `caddy` — local reverse proxy for HTTP routing.
- `agent-api` — governed agent control API.
- `mcp-gateway` — connector-facing MCP starter gateway.
- `postgres` — persistence foundation.
- `redis` — queue/cache foundation.

## Main endpoints

Through the reverse proxy:

- `GET /health`
- `GET /agents`
- `POST /agents/run`
- `GET /tools`
- `GET /approvals`
- `POST /approvals`
- `GET /events`
- `GET /routes`
- `GET /access`
- `GET /.well-known/s-agent-runtime.json`
- `GET /mcp`
- `POST /mcp`

## Management baseline

- External/write actions are approval-gated by default.
- Direct routing is disabled by default.
- Secrets are not returned by any service address.
- There is no arbitrary shell service address.
- Events are recorded for agent runs and approval requests.

## Deployment

Copy this folder to `/opt/s-governed-agents` on the VPS and run:

```bash
cp .env.example .env
# Fill secrets locally on the VPS only.
docker compose up -d --build
docker compose ps
curl -s http://localhost/health
```

## Next production step

Expose `/mcp` over HTTPS using a domain or secure tunnel. Do not expose raw private operator ports publicly.

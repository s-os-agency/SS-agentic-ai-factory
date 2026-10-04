# Agentic AI Factory — plain-language README

## What this is
A collection of scripts that run Seif's AI helpers on a schedule. Each script handles one job, such as revenue tasks, system monitoring or video tasks. The project also has a simple web control panel and a Telegram mini-app.

## Who it's for
Seif, to run and watch his automated helpers.

## What it does today
These commands come from `package.json`. Each one runs one script:

| Command | What it runs |
|---|---|
| `npm run agents` | The main helper runner (`workflows/agent-runtime.js`) |
| `npm run revenue` | The revenue task script |
| `npm run monitor` | The monitoring script |
| `npm run video` | The video helper script |
| `npm run loop` | A repeating loop that keeps running helpers |
| `npm run browser:bootstrap` / `browser:verify` / `browser:agent` | Set up, check and run a helper that can use a web browser |

The rules in the project are:
- Only report real results, never made-up numbers.
- Anything that reaches outside (sending, posting, paying) waits for approval.
- Keep logs as a record of what happened.

GitHub runs four automatic jobs (in `.github/workflows/`):
- the scheduled "Agents Runtime"
- a browser-tool check
- a portfolio check
- a video check

What each script does in detail is not yet confirmed. Read the script before relying on it.

## How to run it
You need Node.js.

1. Copy `.env.example` to `.env` and fill in the values. This includes the Supabase database connection. Never commit real values.
2. Run one of the commands above, for example:
   ```bash
   npm run agents
   ```

The repo also includes `vercel.json`, for hosting the web page on Vercel, and a `vps/` folder, for running on your own server.

## Current status and known gaps
- **The scheduled "Agents Runtime" job on GitHub fails on every run.** The `SUPABASE_URL` setting points to a Supabase database address that no longer exists, so the address can't be found. The Supabase project was probably paused or deleted. The owner needs to restore it or update the setting.
- The other checks: status not yet confirmed.
- The original README listed only principles and no instructions; this file replaces that for readers.

## Where things live
| Folder | What's in it |
|---|---|
| `workflows/` | The scripts behind the commands above |
| `agents/` | Definitions of the individual helpers |
| `runtime/` | Shared running code, including the browser tool |
| `api/` | Web addresses the app answers on |
| `control-panel/`, `index.html` | The web control panel |
| `telegram-mini-app/` | A small app that opens inside Telegram |
| `data/` | Saved data |
| `tests/` | Automated checks |
| `vps/` | Files for running on your own server |
| `.cursor/`, `.Rules` | Instructions for the Cursor AI code editor |

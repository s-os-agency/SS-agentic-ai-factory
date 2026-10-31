---
name: browser-runtime
description: Reuse the verified S/Agency AI-controlled browser execution path to navigate and inspect websites, without repeating completed discovery, permissions, or installation steps.
---

# Universal browser runtime

## When to use

Use when an agent needs to open, navigate, or inspect an external website through the existing `SS-agentic-ai-factory` browser stack. This is a shared capability for agents that have authorized execution access to the Vercel project or a compatible Node/Chrome runtime. No per-destination AI-provider API is needed for basic URL browsing.

## Established working path

- **Verified:** 2026-10-31, real browser launch → `https://example.com/` → DOM snapshot (both exit code 0).
- **Runtime:** `runtime/browser-stack`, `agent-browser@0.35.2`, Chrome for Testing 156.0.8078.80 at time of verification.
- **Proof:** `docs/BROWSER-RUNTIME-VERIFICATION.md`, with command IDs, session ID and actual observed result.
- **Do not redo** previous investigation or recreate a connection to Browserbase MCP or Composio merely to use the existing local/remote CLI browser runtime.

## Execute

1. Use an **existing authorized execution context** with repository access (the successfully tested example was a Vercel sandbox associated with `ss-agentic-ai-factory`). Do not request fresh user authorization when that context is already available.
2. Enter `runtime/browser-stack` in the checked-out repository.
3. If already installed, **skip** setup. Only on a fresh environment, run `npm install --no-audit --no-fund` and `npx --no-install agent-browser install --with-deps` (Linux dependency support may require system privileges).
4. Run these commands for the requested URL:
   ```bash
   npx --no-install agent-browser open https://example.com
   npx --no-install agent-browser snapshot
   npx --no-install agent-browser close
   ```
   Substitute the owner's requested safe HTTPS URL for the example.
5. Report success only when the browser command exits 0 and returns the observed page URL/title or content. Where available, retain the run/session references. Execute additional browser actions only as required by the specific user task.

## Operating rules

- **Proven reusable capability** is not the same as perpetual live service: the original sandbox is ephemeral; another execution host may need provisioning.
- Treat login, MFA, CAPTCHA, and user-presence checks as true authentication boundaries, never bypass them.
- Do not expose browser-control endpoints publicly without appropriate access controls. A public URL may be a test target, not a required dependency or a reason to delay.
- No unapproved consequential writes or transactions.
- Keep responses tight: act, repair routine runtime failures independently, and surface only actual outcomes or strictly required decisions.
- Do not conflate a successful generic browser test with credentials for, or login inside, ChatGPT, Gemini, Grok, or other sites.
- The optional Browserbase MCP bridge is separate from this verified CLI path. Do not present it as a prerequisite.

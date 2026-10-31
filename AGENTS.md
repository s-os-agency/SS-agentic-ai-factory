# Agent instructions — SS-agentic-ai-factory

## Shared browser capability

For all agents operating in this repository, use the reusable browser skill at [`.agents/skills/browser-runtime/SKILL.md`](.agents/skills/browser-runtime/SKILL.md) when a task requires web navigation or page inspection.

The basic AI-controlled browser capability was **verified successful on 2026-10-31** in an authenticated Vercel sandbox. The execution receipts, environmental assumptions, and limited acceptance criteria are recorded in [`docs/BROWSER-RUNTIME-VERIFICATION.md`](docs/BROWSER-RUNTIME-VERIFICATION.md).

Reuse established infrastructure; avoid repeated install/discovery and unnecessary owner authorization. Validate only what changed or what the specific new task requires. Do not treat Browserbase MCP, separate AI-service APIs, or destination logins as prerequisites for basic browser navigation. Never mistake historical proof of capability for a claim that a particular sandbox is continuously running.

## GitHub execution fallback

If the original Manus host is not reachable, use the existing repository as the alternative execution surface; `runtime/github-fallback.mjs` runs a bounded connectivity audit and `.github/workflows/github-fallback.yml` provides a manual GitHub Actions invocation. A repository checkout is not a continuously running worker server; do not mark registered workers as active without an actual run and receipt. Private n8n cannot be reached from a public GitHub runner without an already authorized private transport. Keep any runner credentials scoped to the execution environment, not source.

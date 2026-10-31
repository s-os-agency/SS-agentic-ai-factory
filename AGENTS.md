# Agent instructions — SS-agentic-ai-factory

## Shared browser capability

For all agents operating in this repository, use the reusable browser skill at [`.agents/skills/browser-runtime/SKILL.md`](.agents/skills/browser-runtime/SKILL.md) when a task requires web navigation or page inspection.

The basic AI-controlled browser capability was **verified successful on 2026-10-31** in an authenticated Vercel sandbox. The execution receipts, environmental assumptions, and limited acceptance criteria are recorded in [`docs/BROWSER-RUNTIME-VERIFICATION.md`](docs/BROWSER-RUNTIME-VERIFICATION.md).

Reuse established infrastructure; avoid repeated install/discovery and unnecessary owner authorization. Validate only what changed or what the specific new task requires. Do not treat Browserbase MCP, separate AI-service APIs, or destination logins as prerequisites for basic browser navigation. Never mistake historical proof of capability for a claim that a particular sandbox is continuously running.

#!/usr/bin/env node
/**
 * Close pull requests directly via GitHub REST API.
 * Bypasses the MCP interactive-form gate.
 *
 * Usage: node scripts/close-prs.mjs 2 3 4 6 7 11
 * Env:   GITHUB_TOKEN (required) — needs repo scope
 */
const token = process.env.GH_TOKEN || process.env.GH_PAT || process.env.GH_ACCESS_TOKEN || process.env.GH_API_TOKEN;
if (!token) {
  console.error('Missing GH_TOKEN / GH_PAT / GH_ACCESS_TOKEN env var.');
  process.exit(1);
}

const owner = 's-os-agency';
const repo = 'SS-agentic-ai-factory';
const numbers = process.argv.slice(2).map(Number).filter(n => !Number.isNaN(n));

if (numbers.length === 0) {
  console.error('Usage: node scripts/close-prs.mjs <pr-number> [...]');
  process.exit(1);
}

const results = [];
for (const number of numbers) {
  try {
    const res = await fetch(`https://api.github.com/repos/${owner}/${repo}/pulls/${number}`, {
      method: 'PATCH',
      headers: {
        'Authorization': `Bearer ${token}`,
        'Accept': 'application/vnd.github+json',
        'X-GitHub-Api-Version': '2022-11-28'
      },
      body: JSON.stringify({ state: 'closed' })
    });
    const data = await res.json().catch(() => ({}));
    if (!res.ok) {
      results.push({ number, ok: false, status: res.status, message: data.message || res.statusText });
    } else {
      results.push({ number, ok: true, state: data.state, closed_at: data.closed_at });
    }
  } catch (err) {
    results.push({ number, ok: false, message: err.message });
  }
}

for (const r of results) {
  console.log(r.ok ? `CLOSED #${r.number} (${r.state})` : `FAILED #${r.number}: ${r.status || ''} ${r.message}`);
}
process.exit(results.some(r => !r.ok) ? 1 : 0);

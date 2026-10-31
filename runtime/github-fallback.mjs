// Repository-side fallback for n8n and management-site connectivity checks.
const targets = [
  ['n8n', process.env.N8N_BASE_URL ? new URL('/healthz/readiness', process.env.N8N_BASE_URL).href : null],
  ['workers-control', 'https://s-workers-control.alex-008.chatgpt.site/api/live'],
  ['s-pm', 'https://seif-paperclip.alex-008.chatgpt.site/api/live'],
  ['repository-intelligence', 'https://s-repository-intelligence.alex-008.chatgpt.site/api/live'],
];
const results = [];
for (const [id, url] of targets) {
  if (!url) { results.push({ id, state: 'unconfigured' }); continue; }
  try {
    const res = await fetch(url, { redirect: 'error', signal: AbortSignal.timeout(5000) });
    results.push({ id, httpStatus: res.status, state: res.ok ? 'reachable' : 'requires_access_or_repair' });
  } catch { results.push({ id, state: 'unreachable' }); }
}
console.log(JSON.stringify({
  observedAt: new Date().toISOString(),
  runtime: 'github-codebase',
  results,
  workerActivation: 'unverified',
  conclusion: 'Connectivity alone is not proof of individual worker execution'
}, null, 2));
if (results.some(r => r.state !== 'reachable')) process.exitCode = 1;

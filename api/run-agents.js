import { timingSafeEqual } from 'node:crypto';

const REPO = process.env.GITHUB_REPOSITORY || 's-os-agency/SS-agentic-ai-factory';
const WORKFLOW = 'agents.yml';
const MAX_TASK = 500;

function safeEqual(a, b) {
  const x = Buffer.from(String(a));
  const y = Buffer.from(String(b));
  return x.length === y.length && timingSafeEqual(x, y);
}

export default async function handler(request, response) {
  const allowed = process.env.ALLOWED_ORIGIN;
  if (allowed) {
    response.setHeader('Access-Control-Allow-Origin', allowed);
    response.setHeader('Vary', 'Origin');
  }
  response.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
  response.setHeader('Access-Control-Allow-Headers', 'Content-Type, X-Control-Key');

  if (request.method === 'OPTIONS') return response.status(204).end();
  if (request.method !== 'POST') {
    return response.status(405).json({ ok: false, error: 'method_not_allowed' });
  }

  const key = process.env.CONTROL_PANEL_KEY;
  if (key && !safeEqual(request.headers['x-control-key'] || '', key)) {
    return response.status(401).json({ ok: false, error: 'unauthorized' });
  }

  const token = process.env.GITHUB_RUNTIME_TOKEN || process.env.GITHUB_TOKEN;
  if (!token) return response.status(500).json({ ok: false, error: 'missing_github_token' });

  let body = {};
  try {
    body = typeof request.body === 'string' ? JSON.parse(request.body || '{}') : (request.body || {});
  } catch {
    return response.status(400).json({ ok: false, error: 'invalid_json' });
  }

  const property = String(body.property || 'all');
  const task = String(body.task || '');
  if (!/^(all|#\d{1,6})$/.test(property)) {
    return response.status(400).json({ ok: false, error: 'invalid_property' });
  }
  if (task.length > MAX_TASK) {
    return response.status(400).json({ ok: false, error: 'task_too_long', max: MAX_TASK });
  }

  const githubResponse = await fetch(
    `https://api.github.com/repos/${REPO}/actions/workflows/${WORKFLOW}/dispatches`,
    {
      method: 'POST',
      headers: {
        authorization: 'Bearer ' + token,
        accept: 'application/vnd.github+json',
        'content-type': 'application/json',
        'x-github-api-version': '2022-11-28'
      },
      body: JSON.stringify({ ref: 'main', inputs: { property, task } })
    }
  );

  return response
    .status(githubResponse.ok ? 200 : githubResponse.status)
    .json({ ok: githubResponse.ok, status: githubResponse.status, property, task, repo: REPO });
}

import { spawnSync } from 'node:child_process';

const allowed = {
  monitor: 'workflows/monitoring.workflow.js',
  revenue: 'workflows/revenue.workflow.js',
  loop: 'workflows/autonomous.loop.js',
  video: 'workflows/video-agent.workflow.js',
  agents: 'workflows/agent-runtime.js',
};
const worker = process.argv[2];
if (!Object.hasOwn(allowed, worker)) {
  console.error('Select a registered worker: ' + Object.keys(allowed).join(', '));
  process.exit(2);
}
const startedAt = new Date().toISOString();
const run = spawnSync(process.execPath, [allowed[worker]], {
  cwd: process.cwd(), timeout: 60000, encoding: 'utf8',
  env: process.env, maxBuffer: 256 * 1024,
});
const receipt = {
  schema: 's-agency.github-worker-run.v1',
  worker, script: allowed[worker], startedAt,
  finishedAt: new Date().toISOString(),
  outcome: run.error ? 'execution_error' : run.status === 0 ? 'completed' : 'failed',
  exitCode: run.status,
  // Output is intentionally not uploaded: workflows may expose sensitive data.
};
console.log(JSON.stringify(receipt, null, 2));
process.exit(run.status === 0 ? 0 : 1);

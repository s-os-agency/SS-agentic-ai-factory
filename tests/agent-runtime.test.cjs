const assert = require('node:assert/strict');
const { test } = require('node:test');
const Module = require('node:module');

const runtimeModulePath = require.resolve('../workflows/agent-runtime');

function loadRuntimeWithMocks(mocks) {
  const originalLoad = Module._load;
  Module._load = function patchedLoad(request, parent, isMain) {
    const resolved = Module._resolveFilename(request, parent, isMain);
    if (Object.prototype.hasOwnProperty.call(mocks, resolved)) {
      return mocks[resolved];
    }
    return originalLoad.apply(this, arguments);
  };

  delete require.cache[runtimeModulePath];
  try {
    return require(runtimeModulePath);
  } finally {
    Module._load = originalLoad;
    delete require.cache[runtimeModulePath];
  }
}

test('startAgents degrades gracefully when portfolio orchestrator is unavailable', async () => {
  let telegramMessage = '';
  const failure = new TypeError('fetch failed');
  failure.cause = { code: 'ENOTFOUND', hostname: 'nrjfbqgvigankejaajrt.supabase.co' };

  const { startAgents } = loadRuntimeWithMocks({
    [require.resolve('../workflows/portfolio-orchestrator')]: {
      runPortfolioOrchestrator: async () => {
        throw failure;
      }
    },
    [require.resolve('../workflows/revenue.workflow')]: { runRevenueWorkflow: () => ({ workflow: 'revenue' }) },
    [require.resolve('../workflows/monitoring.workflow')]: { runMonitoringWorkflow: () => ({ workflow: 'monitoring' }) },
    [require.resolve('../workflows/autonomous.loop')]: { runAutonomousLoop: () => ({ workflow: 'operator' }) },
    [require.resolve('../workflows/revenue-signal-loop')]: { generateSignals: () => [] },
    [require.resolve('../workflows/offer-pack-generator')]: { generateOfferPacks: () => [] },
    [require.resolve('../workflows/live-telegram')]: {
      sendTelegram: async (message) => {
        telegramMessage = message;
      }
    }
  });

  const result = await startAgents();
  assert.equal(result.portfolio_orchestrator.status, 'degraded');
  assert.equal(result.portfolio_orchestrator.reason, 'portfolio_orchestrator_unavailable');
  assert.equal(result.portfolio_orchestrator.error_code, 'ENOTFOUND');
  assert.match(telegramMessage, /Factory orchestration cycle completed/);
  assert.match(telegramMessage, /Companies mapped: n\/a/);
});

test('startAgents preserves portfolio totals when orchestrator succeeds', async () => {
  let telegramMessage = '';
  const portfolio = {
    status: 'orchestrating',
    totals: { mapped_companies: 3, urgent_items: 1, open_items: 11 }
  };

  const { startAgents } = loadRuntimeWithMocks({
    [require.resolve('../workflows/portfolio-orchestrator')]: {
      runPortfolioOrchestrator: async () => portfolio
    },
    [require.resolve('../workflows/revenue.workflow')]: { runRevenueWorkflow: () => ({ workflow: 'revenue' }) },
    [require.resolve('../workflows/monitoring.workflow')]: { runMonitoringWorkflow: () => ({ workflow: 'monitoring' }) },
    [require.resolve('../workflows/autonomous.loop')]: { runAutonomousLoop: () => ({ workflow: 'operator' }) },
    [require.resolve('../workflows/revenue-signal-loop')]: { generateSignals: () => [] },
    [require.resolve('../workflows/offer-pack-generator')]: { generateOfferPacks: () => [] },
    [require.resolve('../workflows/live-telegram')]: {
      sendTelegram: async (message) => {
        telegramMessage = message;
      }
    }
  });

  const result = await startAgents();
  assert.deepEqual(result.portfolio_orchestrator, portfolio);
  assert.match(telegramMessage, /Companies mapped: 3/);
  assert.match(telegramMessage, /Urgent items: 1/);
  assert.match(telegramMessage, /Open items: 11/);
});

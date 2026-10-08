const { runRevenueWorkflow } = require('./revenue.workflow');
const { runMonitoringWorkflow } = require('./monitoring.workflow');
const { runAutonomousLoop } = require('./autonomous.loop');
const { sendTelegram } = require('./live-telegram');
const { generateSignals } = require('./revenue-signal-loop');
const { generateOfferPacks } = require('./offer-pack-generator');
const { runPortfolioOrchestrator } = require('./portfolio-orchestrator');

async function startAgents() {
  let portfolio;
  try {
    portfolio = await runPortfolioOrchestrator();
  } catch (error) {
    const cause = error && typeof error === 'object' ? error.cause : undefined;
    const errorCode = cause && typeof cause === 'object' ? cause.code : undefined;
    const errorHostname = cause && typeof cause === 'object' ? cause.hostname : undefined;
    console.warn(JSON.stringify({
      diagnostic: 'portfolio_orchestrator_unavailable',
      message: error instanceof Error ? error.message : String(error),
      error_code: errorCode || null,
      hostname: errorHostname || null
    }));
    portfolio = {
      status: 'degraded',
      reason: 'portfolio_orchestrator_unavailable',
      error_code: errorCode || null
    };
  }

  const runtime = {
    portfolio_orchestrator: portfolio,
    revenue_agent: runRevenueWorkflow({ source: 'agent_runtime' }),
    monitoring_agent: runMonitoringWorkflow(),
    operator_agent: runAutonomousLoop(),
    revenue_signals: generateSignals(),
    offer_packs: generateOfferPacks(),
    started_at: new Date().toISOString(),
    status: 'cycle_complete'
  };

  const totals = portfolio && portfolio.totals ? portfolio.totals : {};
  await sendTelegram(
    `✅ Factory orchestration cycle completed\n` +
    `Companies mapped: ${totals.mapped_companies ?? 'n/a'}\n` +
    `Urgent items: ${totals.urgent_items ?? 'n/a'}\n` +
    `Open items: ${totals.open_items ?? 'n/a'}`
  );

  return runtime;
}

if (require.main === module) {
  startAgents()
    .then((result) => console.log(JSON.stringify(result, null, 2)))
    .catch((error) => {
      console.error(error);
      process.exit(1);
    });
}

module.exports = { startAgents };

const assert = require('node:assert/strict');
const { test } = require('node:test');
const { buildPortfolio } = require('../workflows/portfolio-orchestrator');

test('unnamed projects cannot inflate company priorities or associate workers', () => {
  for (const name of [undefined, null, '', '   ', ' / -- ']) {
    const portfolio = buildPortfolio(
      [{ name, open_items: 12, urgent_items: 3, url: 'https://example.com/unnamed' }],
      [{ worker_name: 'Unassigned worker', project_names: [name] }]
    );
    assert.equal(portfolio.length, 8);
    for (const company of portfolio) {
      assert.equal(company.state, 'unmapped');
      assert.equal(company.open_items, 0);
      assert.equal(company.urgent_items, 0);
      assert.equal(company.next_focus, null);
      assert.deepEqual(company.project_links, []);
      assert.deepEqual(company.workers, []);
    }
  }
});

test('valid company aliases still map projects and workers while empty rows are ignored', () => {
  const project = { name: 'S/ Agent University', open_items: 4, urgent_items: 1, status: 'started' };
  const portfolio = buildPortfolio([
    project,
    { name: '', open_items: 99, urgent_items: 99 }
  ], [{ worker_name: 'Tutor', passport_id: 'ap_test', project_names: [project.name] }]);
  const university = portfolio.find((company) => company.company === 'S/University');
  assert.equal(university.state, 'urgent');
  assert.equal(university.open_items, 4);
  assert.equal(university.urgent_items, 1);
  assert.equal(university.next_focus, project.name);
  assert.equal(university.workers[0].name, 'Tutor');
  assert.equal(portfolio.reduce((total, company) => total + company.open_items, 0), 4);
  assert.equal(portfolio.reduce((total, company) => total + company.urgent_items, 0), 1);
});

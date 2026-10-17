import test from 'node:test';
import assert from 'node:assert/strict';
import {
  safeNum,
  computeHoldingMetrics,
  computePortfolioSummary,
  computeAssetAllocations,
} from '../frontend/src/lib/financialMath';
import { queryKeys } from '../frontend/src/lib/queryKeys';

test('Financial Calculations — safeNum parses valid numbers and handles fallback', () => {
  assert.equal(safeNum('12.3456'), 12.3456);
  assert.equal(safeNum(42), 42);
  assert.equal(safeNum(null, 0), 0);
  assert.equal(safeNum(undefined, 10), 10);
  assert.equal(safeNum('invalid', 5), 5);
});

test('Financial Calculations — computeHoldingMetrics computes exact AVCO metrics', () => {
  // 10 shares purchased at $150.00, current market quote $165.50
  const metrics = computeHoldingMetrics(10, 150, 165.5);

  assert.equal(metrics.marketValue, 1655);
  assert.equal(metrics.costBasis, 1500);
  assert.equal(metrics.unrealizedPL, 155);
  // (155 / 1500) * 100 = 10.3333...%
  assert.ok(Math.abs(metrics.unrealizedPLPercent - 10.3333) < 0.01);
});

test('Financial Calculations — Fractional share precision (PostgreSQL numeric(14,4))', () => {
  // 1.7500 shares at $210.1250, current price $225.5000
  const metrics = computeHoldingMetrics('1.7500', '210.1250', '225.5000');

  assert.equal(metrics.marketValue, 394.625);
  assert.equal(metrics.costBasis, 367.7188);
  assert.equal(metrics.unrealizedPL, 26.9062);
  assert.ok(metrics.unrealizedPLPercent > 0);
});

test('Financial Calculations — computePortfolioSummary aggregates multi-asset books', () => {
  const holdings = [
    { quantity: '10.0000', average_price: '150.0000', current_price: '160.0000' }, // MV: 1600, Cost: 1500
    { quantity: '5.0000', average_price: '200.0000', current_price: '180.0000' },  // MV: 900, Cost: 1000
  ];

  const summary = computePortfolioSummary(holdings);

  assert.equal(summary.totalMarketValue, 2500); // 1600 + 900
  assert.equal(summary.totalCostBasis, 2500);   // 1500 + 1000
  assert.equal(summary.totalUnrealizedPL, 0);   // Break-even
  assert.equal(summary.totalUnrealizedPLPercent, 0);
  assert.equal(summary.activePositionsCount, 2);
});

test('Financial Calculations — computeAssetAllocations reconciles weights to 100.00%', () => {
  const holdings = [
    { symbol: 'AAPL', name: 'Apple Inc.', quantity: 10, current_price: 150 }, // $1,500
    { symbol: 'MSFT', name: 'Microsoft Corp.', quantity: 10, current_price: 350 }, // $3,500
  ];

  const allocations = computeAssetAllocations(holdings);

  assert.equal(allocations.length, 2);
  // Total equity = $5,000. AAPL = 30%, MSFT = 70%
  const aapl = allocations.find((a) => a.symbol === 'AAPL');
  const msft = allocations.find((a) => a.symbol === 'MSFT');

  assert.equal(aapl?.percent, 30);
  assert.equal(msft?.percent, 70);
  assert.equal(aapl!.percent + msft!.percent, 100);
});

test('Query Keys Factory — produces consistent, scoped keys', () => {
  assert.deepEqual(queryKeys.auth.user(), ['auth', 'user']);
  assert.deepEqual(queryKeys.portfolios.lists(), ['portfolios', 'list']);
  assert.deepEqual(queryKeys.portfolios.detail(3), ['portfolios', 'detail', 3]);
  assert.deepEqual(queryKeys.holdings.list(5), ['holdings', 'list', 5]);
  assert.deepEqual(queryKeys.orders.list(5, 1, 10), ['orders', 'list', 5, 1, 10]);
  assert.deepEqual(queryKeys.assets.lists(), ['assets', 'list']);
  assert.deepEqual(queryKeys.assets.detail('TSLA'), ['assets', 'detail', 'TSLA']);
});

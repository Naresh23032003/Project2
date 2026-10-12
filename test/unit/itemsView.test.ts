import { describe, expect, it } from 'vitest';
import { countFilters, filterItems, priceAlerts, sortItems } from '../../src/ui/itemsView';
import type { Recurring } from '../../src/engine/types';

const mk = (over: Partial<Recurring>): Recurring => ({
  id: 'a', merchantKey: 'a', display: 'A', cadence: 'monthly', typicalAmount: 10000, yearlyCost: 120000, hits: [], firstDate: '2024-01-01',
  lastDate: '2024-06-01', nextExpected: '2024-07-01', status: 'active', confidence: 'sure', score: 90, reasons: [], priceChanges: [], missed: 0,
  forgotten: false, category: 'subscription', ...over,
});
const items = [
  mk({ id: 'netflix', display: 'Netflix', yearlyCost: 778800, confidence: 'sure' }),
  mk({ id: 'spotify', display: 'Spotify', yearlyCost: 166800, confidence: 'sure', forgotten: true, priceChanges: [{ date: '2024-04-05', from: 11900, to: 13900 }] }),
  mk({ id: 'dropbox', display: 'Dropbox', yearlyCost: 1078800, status: 'stopped', confidence: 'sure' }),
  mk({ id: 'prime', display: 'Amazon Prime', yearlyCost: 149900, confidence: 'maybe', cadence: 'yearly' }),
  mk({ id: 'gym', display: 'Gym', yearlyCost: 3000000, confidence: 'likely', lastDate: '2024-08-01', nextExpected: '2024-09-01' }),
];

describe('filterItems', () => {
  it.each([
    ['all', 5],
    ['sure', 3],
    ['likely', 1],
    ['maybe', 1],
    ['forgotten', 1],
    ['price', 1],
    ['stopped', 1],
  ] as const)('%s', (f, n) => {
    expect(filterItems(items, f)).toHaveLength(n);
  });

  it('counts every filter in one pass', () => {
    expect(countFilters(items)).toEqual({ all: 5, sure: 3, likely: 1, maybe: 1, forgotten: 1, price: 1, stopped: 1 });
  });
});

describe('sortItems', () => {
  it('sorts by yearly cost with stopped items last by default', () => {
    expect(sortItems(items, 'cost', 'desc').map((i) => i.id)).toEqual(['gym', 'netflix', 'spotify', 'prime', 'dropbox']);
  });
  it('sorts by name both ways', () => {
    expect(sortItems(items, 'name', 'asc').map((i) => i.id)).toEqual(['prime', 'dropbox', 'gym', 'netflix', 'spotify']);
    expect(sortItems(items, 'name', 'desc')[0]!.id).toBe('spotify');
  });
  it('sorts by confidence, surest first', () => {
    expect(sortItems(items, 'confidence', 'desc').map((i) => i.confidence).slice(0, 3)).toEqual(['sure', 'sure', 'sure']);
    expect(sortItems(items, 'confidence', 'desc').at(-1)!.confidence).toBe('maybe');
  });
  it('sorts by next expected date', () => {
    expect(sortItems(items, 'next', 'asc')[0]!.id).not.toBe('gym');
  });
  it('does not change the input', () => {
    const before = items.map((i) => i.id);
    sortItems(items, 'name', 'asc');
    expect(items.map((i) => i.id)).toEqual(before);
  });
});

describe('priceAlerts', () => {
  it('writes one plain sentence per price change, for items that are still live', () => {
    const alerts = priceAlerts(items);
    expect(alerts).toEqual([{ id: 'spotify', text: 'Spotify went from ₹119 to ₹139 in April.' }]);
  });
  it('skips stopped items', () => {
    expect(priceAlerts([mk({ id: 'x', status: 'stopped', priceChanges: [{ date: '2024-04-05', from: 100, to: 200 }] })])).toEqual([]);
  });
  it('says went down when it did', () => {
    const a = priceAlerts([mk({ id: 'y', display: 'Y', priceChanges: [{ date: '2024-02-01', from: 20000, to: 15000 }] })]);
    expect(a[0]!.text).toBe('Y dropped from ₹200 to ₹150 in February.');
  });
});

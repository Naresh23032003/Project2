import { describe, expect, it } from 'vitest';
import { analyze, summarize } from '../../src/engine/analyze';
import { addMonths } from '../../src/engine/dates';
import type { Recurring, Txn } from '../../src/engine/types';

let n = 0;
const tx = (date: string, desc: string, rupees: number, direction: Txn['direction'] = 'debit', source = 'a.csv'): Txn => ({
  id: `t${n++}`, date, desc, amount: rupees * 100, direction, source,
});
const monthly = (start: string, count: number, desc: string, rupees: number, source = 'a.csv') =>
  Array.from({ length: count }, (_, i) => tx(addMonths(start, i), desc, rupees, 'debit', source));

describe('analyze', () => {
  it('merges overlapping files and detects across them', () => {
    const netflix = 'ACH D- NETFLIX ENTERTAINMENT SERVICES INDIA LLP-412345';
    const a = monthly('2024-01-05', 4, netflix, 199, 'a.csv');
    const b = monthly('2024-03-05', 4, netflix, 199, 'b.csv');
    const result = analyze([a, b]);
    expect(result.txns).toHaveLength(6);
    expect(result.recurring).toHaveLength(1);
    expect(result.recurring[0]!.hits).toHaveLength(6);
    expect(result.start).toBe('2024-01-05');
    expect(result.end).toBe('2024-06-05');
    expect(result.months).toBe(5);
  });

  it('handles no transactions', () => {
    const r = analyze([[]]);
    expect(r.recurring).toEqual([]);
    expect(r.months).toBe(0);
  });
});

describe('summarize', () => {
  const base = (over: Partial<Recurring>): Recurring => ({
    id: 'x#0', merchantKey: 'x', display: 'X', cadence: 'monthly', typicalAmount: 10000, yearlyCost: 120000, hits: [],
    firstDate: '2024-01-01', lastDate: '2024-06-01', nextExpected: '2024-07-01', status: 'active', confidence: 'sure', score: 90,
    reasons: [], priceChanges: [], missed: 0, forgotten: false, category: 'subscription', ...over,
  });
  const items = [
    base({ id: 'a', yearlyCost: 240000 }),
    base({ id: 'b', yearlyCost: 120000, confidence: 'likely' }),
    base({ id: 'c', yearlyCost: 60000, confidence: 'maybe' }),
    base({ id: 'd', yearlyCost: 500000, status: 'stopped' }),
    base({ id: 'e', yearlyCost: 900000, category: 'emi' }),
  ];

  it('counts active Sure and Likely subscriptions in the headline', () => {
    const s = summarize(items, {});
    expect(s.yearlyTotal).toBe(360000);
    expect(s.count).toBe(2);
    expect(s.maybeCount).toBe(1);
    expect(s.otherCount).toBe(1);
    expect(s.stoppedCount).toBe(1);
  });

  it('drops items marked not a subscription', () => {
    const s = summarize(items, { a: 'not' });
    expect(s.yearlyTotal).toBe(120000);
    expect(s.count).toBe(1);
  });

  it('adds up savings from items marked cancel, including maybes', () => {
    const s = summarize(items, { a: 'cancel', c: 'cancel', b: 'keep' });
    expect(s.potentialSavings).toBe(300000);
  });

  it('ignores cancel marks on items marked not, stopped items, and other categories', () => {
    const s = summarize(items, { d: 'cancel', e: 'cancel' });
    expect(s.potentialSavings).toBe(0);
  });
});

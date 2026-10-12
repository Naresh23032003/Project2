import { describe, expect, it } from 'vitest';
import { exportCsv, summaryText } from '../../src/engine/export';
import type { Recurring } from '../../src/engine/types';

const item = (over: Partial<Recurring>): Recurring => ({
  id: 'netflix#0', merchantKey: 'netflix', display: 'Netflix', cadence: 'monthly', typicalAmount: 64900, yearlyCost: 778800,
  hits: [], firstDate: '2024-01-05', lastDate: '2024-08-05', nextExpected: '2024-09-05', status: 'active', confidence: 'sure', score: 100,
  reasons: ['Charged around the 5th each month, 8 months in a row', 'Same amount each time (₹649)'], priceChanges: [], missed: 0, forgotten: false,
  category: 'subscription', ...over,
});

describe('exportCsv', () => {
  it('writes a header, one row per item, and plain numbers in rupees', () => {
    const csv = exportCsv([item({})], { 'netflix#0': 'cancel' });
    const [head, row] = csv.trim().split('\n');
    expect(head).toBe('Service,Type,How often,Typical amount (INR),Per year (INR),First charged,Last charged,Next expected,Confidence,Status,Your choice,Why we think so');
    expect(row).toBe('Netflix,Subscription,Monthly,649.00,7788.00,2024-01-05,2024-08-05,2024-09-05,Sure,Active,Cancel,"Charged around the 5th each month, 8 months in a row; Same amount each time (₹649)"');
  });

  it('quotes commas, quotes and newlines', () => {
    const csv = exportCsv([item({ display: 'Acme, "Pro"\nplan' })], {});
    expect(csv).toContain('"Acme, ""Pro""\nplan"');
  });

  it('defuses spreadsheet formulas', () => {
    const csv = exportCsv([item({ display: '=HYPERLINK("http://x")' }), item({ id: 'b', display: '+cmd' }), item({ id: 'c', display: '@sum' }), item({ id: 'd', display: '-1+1' })], {});
    const rows = csv.trim().split('\n').slice(1);
    for (const r of rows) expect(r.startsWith("'") || r.startsWith('"\'')).toBe(true);
  });

  it('labels unmarked items as not decided', () => {
    expect(exportCsv([item({})], {})).toContain(',Not decided,');
  });

  it('labels the other categories in plain words', () => {
    expect(exportCsv([item({ category: 'emi' })], {})).toContain(',Loan or EMI,');
    expect(exportCsv([item({ category: 'sip' })], {})).toContain(',Investment (SIP),');
  });
});

describe('summaryText', () => {
  const items = [
    item({}),
    item({ id: 'spotify#0', display: 'Spotify', yearlyCost: 166800, typicalAmount: 13900, confidence: 'likely' }),
    item({ id: 'x#0', display: 'Gym', yearlyCost: 3000000, typicalAmount: 250000, confidence: 'sure' }),
  ];

  it('states the total, the count and the savings', () => {
    const t = summaryText(items, { 'x#0': 'cancel' }, { includeNames: true });
    expect(t).toContain('₹39,456 a year');
    expect(t).toContain('3 recurring things');
    expect(t).toContain('₹30,000 a year');
    expect(t).toContain('Gym');
  });

  it('leaves names out when asked', () => {
    const t = summaryText(items, { 'x#0': 'cancel' }, { includeNames: false });
    expect(t).not.toContain('Gym');
    expect(t).not.toContain('Netflix');
    expect(t).toContain('₹30,000 a year');
  });

  it('skips the savings line when nothing is marked', () => {
    expect(summaryText(items, {}, { includeNames: true })).not.toMatch(/cancel/i);
  });

  it('handles the empty case in plain words', () => {
    expect(summaryText([], {}, { includeNames: true })).toMatch(/no recurring/i);
  });
});

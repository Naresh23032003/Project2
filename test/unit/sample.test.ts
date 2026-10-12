import { describe, expect, it } from 'vitest';
import { analyze, summarize } from '../../src/engine/analyze';
import { parseStatement } from '../../src/engine/parse/file';
import { SAMPLE_FILE_NAME, sampleStatementCsv } from '../../src/engine/sample';

async function run() {
  const csv = sampleStatementCsv();
  const out = await parseStatement(SAMPLE_FILE_NAME, new TextEncoder().encode(csv).buffer as ArrayBuffer);
  if (out.status !== 'ok') throw new Error(out.status);
  return { out, result: analyze([out.txns]) };
}

describe('sample statement', () => {
  it('is a CSV file name the parser accepts and reads without skipped rows', async () => {
    const { out } = await run();
    expect(SAMPLE_FILE_NAME).toMatch(/\.csv$/);
    expect(out.skippedRows).toBe(0);
    expect(out.bank).toBe('hdfc');
    expect(out.txns.length).toBeGreaterThan(80);
  });

  it('is the same every time', () => {
    expect(sampleStatementCsv()).toBe(sampleStatementCsv());
  });

  it('shows the headline features', async () => {
    const { result } = await run();
    const subs = result.recurring.filter((r) => r.category === 'subscription');
    const keys = subs.map((r) => r.merchantKey);
    expect(keys).toEqual(expect.arrayContaining(['netflix', 'spotify', 'google-play', 'apple', 'amazon-prime']));
    expect(subs.find((r) => r.merchantKey === 'spotify')?.priceChanges).toHaveLength(1);
    expect(subs.some((r) => r.forgotten)).toBe(true);
    expect(subs.some((r) => r.status === 'stopped')).toBe(true);
    const others = result.recurring.filter((r) => r.category !== 'subscription').map((r) => r.category);
    expect(others).toEqual(expect.arrayContaining(['rent', 'emi', 'sip', 'bill']));
  });

  it('never labels a wrong item Sure', async () => {
    const { result } = await run();
    const sure = result.recurring.filter((r) => r.confidence === 'sure').map((r) => r.merchantKey).sort();
    const real = ['apple', 'cult-fit', 'dropbox', 'google-play', 'hdfc', 'icici prudential mutual fund', 'netflix', 'spotify'];
    expect(sure.every((k) => real.includes(k))).toBe(true);
    expect(sure).toEqual(expect.arrayContaining(['netflix', 'spotify', 'cult-fit']));
  });

  it('gives a headline worth looking at', async () => {
    const { result } = await run();
    const s = summarize(result.recurring, {});
    expect(s.count).toBeGreaterThanOrEqual(4);
    expect(s.yearlyTotal).toBeGreaterThan(3000000);
  });

  it('uses made-up names only', () => {
    const csv = sampleStatementCsv();
    expect(csv).toMatch(/TEST PERSON/);
    expect(csv).not.toMatch(/@gmail|@yahoo/i);
  });
});

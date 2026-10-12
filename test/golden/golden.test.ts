import { mkdirSync, writeFileSync } from 'node:fs';
import { describe, expect, it } from 'vitest';
import { analyze } from '../../src/engine/analyze';
import { parseStatement } from '../../src/engine/parse/file';
import type { Recurring, Txn } from '../../src/engine/types';
import { personas, type Expect, type Persona } from './personas';
import { renderFile } from './render';

export async function run(p: Persona) {
  const files: Txn[][] = [];
  const warnings: string[] = [];
  for (const spec of p.files) {
    const rows = p.rows.filter((r) => (r.src ?? 'bank') === (spec.only ?? 'bank') && r.date >= spec.from && r.date <= spec.to);
    const rendered = renderFile(spec.name, spec.layout, spec.format, rows);
    const data = rendered.csv !== undefined ? new TextEncoder().encode(rendered.csv).buffer : (rendered.bytes as ArrayBuffer);
    const out = await parseStatement(spec.name, data as ArrayBuffer);
    if (out.status !== 'ok') throw new Error(`${spec.name}: ${out.status}`);
    warnings.push(...out.warnings);
    expect(out.txns.length, spec.name).toBe(rows.length);
    files.push(out.txns);
  }
  return { analysis: analyze(files), warnings };
}

function matches(d: Recurring, e: Expect): boolean {
  if (d.merchantKey !== e.key) return false;
  if (e.amount !== undefined && Math.abs(d.typicalAmount / 100 - e.amount) > Math.max(10, e.amount * 0.12)) return false;
  return true;
}

type Score = { name: string; expected: number; found: number; truePositives: number; falsePositives: string[]; misses: string[]; falseSure: string[] };

export function score(p: Persona, detected: Recurring[]): Score {
  const unmatched = [...detected];
  const misses: string[] = [];
  let tp = 0;
  for (const e of p.expected) {
    const i = unmatched.findIndex((d) => matches(d, e));
    const label = `${e.key}${e.amount ? ' ' + e.amount : ''}`;
    if (i === -1) {
      misses.push(`${label}: not detected`);
      continue;
    }
    const d = unmatched.splice(i, 1)[0] as Recurring;
    const problems: string[] = [];
    if (d.cadence !== e.cadence) problems.push(`cadence ${d.cadence} not ${e.cadence}`);
    if (d.category !== e.category) problems.push(`category ${d.category} not ${e.category}`);
    if (e.status && d.status !== e.status) problems.push(`status ${d.status} not ${e.status}`);
    if (problems.length) misses.push(`${label}: ${problems.join(', ')}`);
    else tp++;
  }
  return {
    name: p.name,
    expected: p.expected.length,
    found: detected.length,
    truePositives: tp,
    falsePositives: unmatched.map((d) => `${d.merchantKey} ${d.cadence} ${d.typicalAmount / 100} ${d.confidence} ${d.category}`),
    misses,
    falseSure: unmatched.filter((d) => d.confidence === 'sure').map((d) => d.merchantKey),
  };
}

describe('golden statements', () => {
  const all = personas();
  const scores: Score[] = [];

  it.each(all.map((p) => [p.name, p] as const))('%s', async (_name, p) => {
    const { analysis } = await run(p);
    const s = score(p, analysis.recurring);
    scores.push(s);
    expect(s.falseSure, 'false Sure labels').toEqual([]);
    expect(s.misses, 'misses').toEqual([]);
  });

  it('meets the overall bar', () => {
    const expected = scores.reduce((a, s) => a + s.expected, 0);
    const tp = scores.reduce((a, s) => a + s.truePositives, 0);
    const found = scores.reduce((a, s) => a + s.found, 0);
    const recall = tp / expected;
    const precision = tp / found;
    mkdirSync('test-results', { recursive: true });
    writeFileSync('test-results/golden.json', JSON.stringify({ recall, precision, scores }, null, 2));
    expect(scores.length).toBe(all.length);
    expect(recall).toBeGreaterThanOrEqual(0.9);
    expect(precision).toBeGreaterThanOrEqual(0.8);
  });
});

import { describe, expect, it } from 'vitest';
import { personas } from './personas';
import { run, score } from './golden.test';

describe('golden statements across random seeds', () => {
  it('keeps recall above 90% and never labels a wrong item Sure', async () => {
    let expected = 0;
    let tp = 0;
    let found = 0;
    const falseSure: string[] = [];
    const misses = new Map<string, number>();
    const fps = new Map<string, number>();
    for (let seed = 1; seed <= 25; seed++) {
      for (const p of personas(seed * 100)) {
        const { analysis } = await run(p);
        const s = score(p, analysis.recurring);
        expected += s.expected;
        tp += s.truePositives;
        found += s.found;
        falseSure.push(...s.falseSure.map((k) => `${p.name}/seed${seed}: ${k}`));
        for (const m of s.misses) misses.set(`${p.name}: ${m}`, (misses.get(`${p.name}: ${m}`) ?? 0) + 1);
        for (const f of s.falsePositives) fps.set(`${p.name}: ${f}`, (fps.get(`${p.name}: ${f}`) ?? 0) + 1);
      }
    }
    console.log('seeds recall', (tp / expected).toFixed(3), 'precision', (tp / found).toFixed(3));
    console.log('misses', [...misses.entries()].sort((a, b) => b[1] - a[1]).slice(0, 12));
    console.log('false positives', [...fps.entries()].sort((a, b) => b[1] - a[1]).slice(0, 12));
    expect(falseSure).toEqual([]);
    expect(tp / expected).toBeGreaterThanOrEqual(0.9);
  }, 120000);
});

import { describe, expect, it } from 'vitest';
import { analyze } from '../../src/engine/analyze';
import { parseStatement } from '../../src/engine/parse/file';
import { Gen } from './personas';
import { renderFile } from './render';

describe('performance', () => {
  it('parses and analyses a 12 month, 5000 row statement in under 2 seconds', async () => {
    const g = new Gen(7);
    const vendors = Array.from({ length: 250 }, (_, i) => `VENDOR ${String.fromCharCode(65 + (i % 26))}${String.fromCharCode(65 + ((i * 7) % 26))}${i} STORES`);
    g.monthly('2024-01', 12, 5, () => `ACH D- NETFLIX ENTERTAINMENT SERVICES INDIA LLP-${g.ref()}`, 649);
    g.monthly('2024-01', 12, 12, () => `UPI-SPOTIFY INDIA-SPOTIFYUPI.PAYU@HDFCBANK-HDFC0000001-${g.ref()}-UPI MANDATE`, 139);
    g.monthly('2024-01', 12, 7, () => `ACH D- HDFC LTD-${g.ref()}`, 18500);
    g.scatter(5000, '2024-01-01', '2024-12-31', () => `UPI/P2M/${g.ref()}/${g.pick(vendors)}/Pay to/Axis Bank`, 20, 3000);
    const rendered = renderFile('big.csv', 'axis', 'csv', g.rows);
    const data = new TextEncoder().encode(rendered.csv).buffer as ArrayBuffer;

    const t0 = performance.now();
    const out = await parseStatement('big.csv', data);
    expect(out.status).toBe('ok');
    if (out.status !== 'ok') return;
    const result = analyze([out.txns]);
    const ms = performance.now() - t0;

    expect(out.txns.length).toBeGreaterThanOrEqual(5000);
    expect(result.recurring.some((r) => r.merchantKey === 'netflix')).toBe(true);
    console.log(`pipeline for ${out.txns.length} rows: ${ms.toFixed(0)} ms`);
    expect(ms).toBeLessThan(2000);
  }, 30000);
});

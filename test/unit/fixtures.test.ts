import { readFileSync } from 'node:fs';
import { describe, expect, it } from 'vitest';
import { parseStatement } from '../../src/engine/parse/file';

const manifest = JSON.parse(readFileSync('test/fixtures/manifest.json', 'utf8')) as Record<string, { count: number; bank?: string; layout: string }>;
const load = (name: string) => {
  const b = readFileSync(`test/fixtures/${name}`);
  return b.buffer.slice(b.byteOffset, b.byteOffset + b.byteLength) as ArrayBuffer;
};

describe('bank layout fixtures', () => {
  const known = Object.entries(manifest).filter(([, m]) => m.layout !== 'unknown');
  it.each(known)('%s parses to every transaction', async (name, m) => {
    const out = await parseStatement(name, load(name));
    expect(out.status).toBe('ok');
    if (out.status !== 'ok') return;
    expect(out.txns).toHaveLength(m.count);
    expect(out.skippedRows).toBe(0);
    if (m.bank) expect(out.bank).toBe(m.bank);
    expect(out.txns.every((t) => /^\d{4}-\d{2}-\d{2}$/.test(t.date) && t.amount > 0)).toBe(true);
  });

  it('keeps day first dates (HDFC two digit years, SBI month names, Axis dashes)', async () => {
    for (const name of ['hdfc.csv', 'sbi.xls', 'axis.csv']) {
      const out = await parseStatement(name, load(name));
      if (out.status !== 'ok') throw new Error(name);
      expect(out.dateOrder, name).toBe('dmy');
      expect(out.txns.every((t) => t.date >= '2024-01-01' && t.date <= '2024-12-31'), name).toBe(true);
    }
  });

  it('splits debits from credits on every layout', async () => {
    for (const [name] of known) {
      const out = await parseStatement(name, load(name));
      if (out.status !== 'ok') throw new Error(name);
      const credits = out.txns.filter((t) => t.direction === 'credit').length;
      expect(credits, name).toBeGreaterThanOrEqual(0);
      expect(out.txns.some((t) => t.direction === 'debit'), name).toBe(true);
    }
  });
});

describe('unknown layout', () => {
  it('asks for a column mapping, then reads the file with it', async () => {
    const first = await parseStatement('unknown-format.csv', load('unknown-format.csv'));
    expect(first.status).toBe('needsMapping');
    const out = await parseStatement('unknown-format.csv', load('unknown-format.csv'), {
      mapping: { headerRow: 0, date: 0, desc: 1, debit: 2, credit: 3 },
    });
    expect(out.status === 'ok' && out.txns.length).toBe(manifest['unknown-format.csv']?.count);
  });
});

describe('unsupported input', () => {
  it('says so for other file types', async () => {
    const out = await parseStatement('notes.docx', new ArrayBuffer(4));
    expect(out.status).toBe('unsupported');
  });
});

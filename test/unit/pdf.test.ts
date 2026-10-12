import { readFileSync } from 'node:fs';
import { describe, expect, it } from 'vitest';
import * as pdfjs from 'pdfjs-dist/legacy/build/pdf.mjs';
import { extractPdfGrid, type PdfJs } from '../../src/engine/parse/pdf';
import { parseStatement } from '../../src/engine/parse/file';
import { parseGrid } from '../../src/engine/parse/table';

const load = (name: string) => {
  const b = readFileSync(`test/fixtures/${name}`);
  return b.buffer.slice(b.byteOffset, b.byteOffset + b.byteLength) as ArrayBuffer;
};
const expected = JSON.parse(readFileSync('test/fixtures/hdfc-text.expected.json', 'utf8')) as {
  password: string;
  txns: { date: string; desc: string; amount: number; direction: string }[];
};
const strip = (s: string) => s.replace(/\s+/g, '');
const lib = pdfjs as unknown as PdfJs;

async function txnsFrom(name: string, password?: string) {
  const r = await extractPdfGrid(lib, load(name), password);
  if (r.status !== 'ok') throw new Error(r.status);
  const t = parseGrid(r.grid, { source: name });
  if (t.status !== 'ok') throw new Error('table ' + t.status);
  return t;
}

describe('extractPdfGrid', () => {
  it('reads a text statement into the same transactions that were drawn', async () => {
    const t = await txnsFrom('hdfc-text.pdf');
    expect(t.txns).toHaveLength(expected.txns.length);
    expected.txns.forEach((e, i) => {
      const got = t.txns[i]!;
      expect([got.date, got.amount, got.direction]).toEqual([e.date, e.amount, e.direction]);
      expect(strip(got.desc)).toBe(strip(e.desc));
    });
  });

  it('survives a page break with a repeated header', async () => {
    const t = await txnsFrom('hdfc-text.pdf');
    expect(t.txns.at(-1)?.date).toBe(expected.txns.at(-1)?.date);
    expect(t.skippedRows).toBe(0);
  });

  it('recognises the bank from the text above the table', async () => {
    expect((await txnsFrom('hdfc-text.pdf')).bank).toBe('hdfc');
  });

  it('asks for a password when the file is protected', async () => {
    expect((await extractPdfGrid(lib, load('hdfc-password.pdf'))).status).toBe('needsPassword');
  });

  it('rejects a wrong password', async () => {
    expect((await extractPdfGrid(lib, load('hdfc-password.pdf'), 'wrong')).status).toBe('wrongPassword');
  });

  it('opens a protected file with the right password', async () => {
    const t = await txnsFrom('hdfc-password.pdf', expected.password);
    expect(t.txns).toHaveLength(expected.txns.length);
  });

  it('reports a scanned statement instead of returning nothing', async () => {
    expect((await extractPdfGrid(lib, load('scanned.pdf'))).status).toBe('scanned');
  });

  it('reports a file that is not a PDF', async () => {
    const junk = new TextEncoder().encode('this is not a pdf at all').buffer as ArrayBuffer;
    expect((await extractPdfGrid(lib, junk)).status).toBe('unsupported');
  });
});

describe('parseStatement with PDFs', () => {
  it('goes from a PDF straight to transactions', async () => {
    const out = await parseStatement('statement.pdf', load('hdfc-text.pdf'), { pdfjs: lib });
    expect(out.status === 'ok' && out.txns.length).toBe(expected.txns.length);
  });

  it('passes the password through', async () => {
    expect((await parseStatement('s.pdf', load('hdfc-password.pdf'), { pdfjs: lib })).status).toBe('needsPassword');
    expect((await parseStatement('s.pdf', load('hdfc-password.pdf'), { pdfjs: lib, password: expected.password })).status).toBe('ok');
  });

  it('reports a scanned PDF', async () => {
    expect((await parseStatement('s.pdf', load('scanned.pdf'), { pdfjs: lib })).status).toBe('scanned');
  });
});

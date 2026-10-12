import type { Cell, Grid } from '../types';
import { headerKind } from './table';

export type PdfResult =
  | { status: 'ok'; grid: Grid }
  | { status: 'scanned' }
  | { status: 'needsPassword' }
  | { status: 'wrongPassword' }
  | { status: 'unsupported'; reason: string };

type TextItem = { str: string; transform: number[]; width: number };
type PdfPage = { getTextContent(): Promise<{ items: unknown[] }> };
type PdfDoc = { numPages: number; getPage(n: number): Promise<PdfPage>; destroy?: () => unknown };
export type PdfJs = {
  getDocument(src: { data: Uint8Array; password?: string; verbosity?: number }): { promise: Promise<unknown> };
};

type Piece = { str: string; x: number; w: number };
type Line = { y: number; pieces: Piece[] };
type Column = { text: string; x0: number; x1: number };

const LINE_TOLERANCE = 2.5;
const MAX_PAGES = 200;
const MIN_TEXT_CHARS = 30;
const PAGE_FOOTER = /^(page\s+\d+(\s+of\s+\d+)?|\d+\s*\/\s*\d+)$/i;

function isTextItem(it: unknown): it is TextItem {
  return typeof it === 'object' && it !== null && 'str' in it && 'transform' in it;
}

async function pageLines(page: PdfPage): Promise<Line[]> {
  const content = await page.getTextContent();
  const pieces = content.items
    .filter(isTextItem)
    .filter((it) => it.str.trim() !== '')
    .map((it) => ({ str: it.str.trim(), x: it.transform[4] as number, y: it.transform[5] as number, w: it.width }));
  pieces.sort((a, b) => b.y - a.y || a.x - b.x);
  const lines: Line[] = [];
  for (const p of pieces) {
    const line = lines.find((l) => Math.abs(l.y - p.y) <= LINE_TOLERANCE);
    if (line) line.pieces.push({ str: p.str, x: p.x, w: p.w });
    else lines.push({ y: p.y, pieces: [{ str: p.str, x: p.x, w: p.w }] });
  }
  for (const l of lines) l.pieces.sort((a, b) => a.x - b.x);
  return lines;
}

// Neighbouring pieces closer than a space belong to one header cell.
function headerCells(line: Line): Column[] {
  const cols: Column[] = [];
  for (const p of line.pieces) {
    const last = cols[cols.length - 1];
    if (last && p.x - last.x1 < 4) {
      last.text += ' ' + p.str;
      last.x1 = p.x + p.w;
    } else cols.push({ text: p.str, x0: p.x, x1: p.x + p.w });
  }
  return cols;
}

function isHeader(cols: Column[]): boolean {
  const kinds = new Set(cols.map((c) => headerKind(c.text)));
  const hasDate = kinds.has('date') || kinds.has('valueDate');
  const hasAmount = kinds.has('debit') || kinds.has('credit') || kinds.has('amount');
  return hasDate && kinds.has('desc') && hasAmount;
}

function columnFor(p: Piece, cols: Column[]): number {
  let best = -1;
  let bestOverlap = 0;
  cols.forEach((c, i) => {
    const overlap = Math.min(p.x + p.w, c.x1 + 4) - Math.max(p.x, c.x0 - 4);
    if (overlap > bestOverlap) {
      best = i;
      bestOverlap = overlap;
    }
  });
  if (best !== -1) return best;
  const mid = p.x + p.w / 2;
  let nearest = 0;
  let dist = Infinity;
  cols.forEach((c, i) => {
    const d = Math.abs((c.x0 + c.x1) / 2 - mid);
    if (d < dist) {
      nearest = i;
      dist = d;
    }
  });
  return nearest;
}

export async function extractPdfGrid(pdfjs: PdfJs, data: ArrayBuffer, password?: string): Promise<PdfResult> {
  let doc: PdfDoc;
  try {
    doc = (await pdfjs.getDocument({ data: new Uint8Array(data.slice(0)), password, verbosity: 0 }).promise) as PdfDoc;
  } catch (e) {
    const err = e as { name?: string; code?: number };
    if (err.name === 'PasswordException') return { status: err.code === 2 ? 'wrongPassword' : 'needsPassword' };
    return { status: 'unsupported', reason: 'That file does not look like a readable PDF.' };
  }

  try {
    const grid: Grid = [];
    let columns: Column[] | null = null;
    let chars = 0;
    for (let n = 1; n <= Math.min(doc.numPages, MAX_PAGES); n++) {
      const lines = await pageLines(await doc.getPage(n));
      for (const line of lines) {
        const joined = line.pieces.map((p) => p.str).join(' ');
        chars += joined.replace(/\s/g, '').length;
        if (PAGE_FOOTER.test(joined)) continue;
        const cells = headerCells(line);
        if (isHeader(cells)) {
          if (!columns) {
            columns = cells;
            grid.push(cells.map((c) => c.text));
          }
          continue;
        }
        if (!columns) {
          grid.push([joined]);
          continue;
        }
        const row: Cell[] = columns.map(() => '');
        for (const p of line.pieces) {
          const i = columnFor(p, columns);
          row[i] = row[i] ? `${row[i]} ${p.str}` : p.str;
        }
        grid.push(row);
      }
    }
    if (chars < MIN_TEXT_CHARS) return { status: 'scanned' };
    return { status: 'ok', grid };
  } finally {
    void doc.destroy?.();
  }
}

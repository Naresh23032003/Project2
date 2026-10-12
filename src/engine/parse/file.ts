import type { ColumnMapping, Grid, NeedsMapping, ParsedTable, TableResult } from '../types';
import { parseCsvText } from './csv';
import { extractPdfGrid, type PdfJs } from './pdf';
import { parseWorkbook } from './sheet';
import { parseGrid } from './table';

export type ParseOptions = {
  password?: string;
  mapping?: ColumnMapping;
  flip?: boolean;
  dateOrder?: 'dmy' | 'mdy';
  /** The pdf.js module. Passed in so the engine itself stays free of browser and Node specifics. */
  pdfjs?: PdfJs;
};
export type FileOutcome =
  | ParsedTable
  | NeedsMapping
  | { status: 'scanned' }
  | { status: 'needsPassword' }
  | { status: 'wrongPassword' }
  | { status: 'unsupported'; reason: string };

function decodeText(data: ArrayBuffer): string {
  const utf8 = new TextDecoder('utf-8').decode(data);
  return utf8.includes('�') ? new TextDecoder('windows-1252').decode(data) : utf8;
}

function bestOf(results: TableResult[]): TableResult {
  const ok = results.filter((r): r is ParsedTable => r.status === 'ok');
  if (ok.length > 0) return ok.reduce((a, b) => (b.txns.length > a.txns.length ? b : a));
  const grids = results.filter((r): r is NeedsMapping => r.status === 'needsMapping');
  return grids.reduce((a, b) => (b.grid.length > a.grid.length ? b : a));
}

export async function parseStatement(name: string, data: ArrayBuffer, opts: ParseOptions = {}): Promise<FileOutcome> {
  const lower = name.toLowerCase();
  const table = { source: name, mapping: opts.mapping, flip: opts.flip, dateOrder: opts.dateOrder };
  if (/\.(csv|txt|tsv)$/.test(lower)) {
    return parseGrid(parseCsvText(decodeText(data)), table);
  }
  if (/\.(xlsx|xls|xlsm)$/.test(lower)) {
    const grids: Grid[] = parseWorkbook(data).filter((g) => g.length > 0);
    if (grids.length === 0) return { status: 'unsupported', reason: 'The workbook has no data.' };
    return bestOf(grids.map((g) => parseGrid(g, table)));
  }
  if (/\.pdf$/.test(lower)) {
    if (!opts.pdfjs) return { status: 'unsupported', reason: 'PDF reading is not available here.' };
    const pdf = await extractPdfGrid(opts.pdfjs, data, opts.password);
    if (pdf.status !== 'ok') return pdf;
    return parseGrid(pdf.grid, table);
  }
  return { status: 'unsupported', reason: 'That file type is not supported. Use CSV, XLS, XLSX or a text PDF.' };
}

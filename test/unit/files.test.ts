import { describe, expect, it } from 'vitest';
import * as XLSX from '@e965/xlsx';
import { parseCsvText } from '../../src/engine/parse/csv';
import { parseWorkbook } from '../../src/engine/parse/sheet';
import { parseGrid } from '../../src/engine/parse/table';

describe('parseCsvText', () => {
  it('strips a byte order mark and keeps ragged junk rows', () => {
    const grid = parseCsvText('﻿Account Name,MR TEST\nIFSC,HDFC0000123\n\nDate,Narration,Withdrawal Amt.,Deposit Amt.\n05/01/24,NETFLIX,199.00,\n');
    expect(grid[0]).toEqual(['Account Name', 'MR TEST']);
    expect(grid[3]).toEqual(['Date', 'Narration', 'Withdrawal Amt.', 'Deposit Amt.']);
    expect(grid[4]).toEqual(['05/01/24', 'NETFLIX', '199.00', '']);
  });

  it('handles quoted commas and quotes', () => {
    const grid = parseCsvText('Date,Description,Amount\n01/01/2024,"ACME, INC ""PRO""","1,299.00"\n');
    expect(grid[1]).toEqual(['01/01/2024', 'ACME, INC "PRO"', '1,299.00']);
  });

  it('detects semicolons and tabs', () => {
    expect(parseCsvText('Date;Description;Amount\n01/01/2024;A;10\n')[1]).toEqual(['01/01/2024', 'A', '10']);
    expect(parseCsvText('Date\tDescription\tAmount\n01/01/2024\tA\t10\n')[1]).toEqual(['01/01/2024', 'A', '10']);
  });

  it('feeds the table parser end to end', () => {
    const r = parseGrid(parseCsvText('Date,Narration,Withdrawal Amt.,Deposit Amt.\n05/01/24,NETFLIX,"1,199.00",\n'), { source: 'a.csv' });
    expect(r.status === 'ok' && r.txns[0]?.amount).toBe(119900);
  });
});

function workbook(rows: unknown[][], bookType: 'xlsx' | 'biff8' = 'xlsx', dateCol?: number): ArrayBuffer {
  const ws = XLSX.utils.aoa_to_sheet(rows);
  if (dateCol !== undefined) {
    for (let r = 1; r < rows.length; r++) {
      const addr = XLSX.utils.encode_cell({ r, c: dateCol });
      const cell = ws[addr];
      if (cell) cell.z = 'm/d/yy';
    }
  }
  const wb = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(wb, ws, 'Sheet1');
  const out = XLSX.write(wb, { type: 'array', bookType }) as ArrayBuffer;
  return out;
}

describe('parseWorkbook', () => {
  const rows = [
    ['Statement for MR TEST'],
    ['Date', 'Narration', 'Withdrawal Amt.', 'Deposit Amt.'],
    ['05/01/2024', 'NETFLIX', 199, ''],
  ];

  it('reads text cells and numbers from xlsx', () => {
    const [grid] = parseWorkbook(workbook(rows));
    expect(grid?.[2]).toEqual(['05/01/2024', 'NETFLIX', 199, '']);
  });

  it('reads the old xls format', () => {
    const [grid] = parseWorkbook(workbook(rows, 'biff8'));
    expect(grid?.[1]).toEqual(['Date', 'Narration', 'Withdrawal Amt.', 'Deposit Amt.']);
  });

  it('turns real date cells into ISO dates whatever their display format', () => {
    // 45356 is 5 March 2024. The cell is formatted m/d/yy, which would print 3/5/24 and look like 3 May.
    const dated = [
      ['Date', 'Narration', 'Debit', 'Credit'],
      [{ v: 45356, t: 'n' }, 'SPOTIFY', 119, ''],
    ];
    const ws = XLSX.utils.aoa_to_sheet(dated.map((r) => r.map((c) => (typeof c === 'object' ? (c as { v: number }).v : c))));
    (ws['A2'] as XLSX.CellObject).z = 'm/d/yy';
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, 'S');
    const [grid] = parseWorkbook(XLSX.write(wb, { type: 'array', bookType: 'xlsx' }) as ArrayBuffer);
    expect(grid?.[1]?.[0]).toBe('2024-03-05');
    const r = parseGrid(grid ?? [], { source: 'x.xlsx' });
    expect(r.status === 'ok' && r.txns[0]?.date).toBe('2024-03-05');
  });

  it('returns one grid per sheet', () => {
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, XLSX.utils.aoa_to_sheet([['a']]), 'One');
    XLSX.utils.book_append_sheet(wb, XLSX.utils.aoa_to_sheet([['b']]), 'Two');
    const grids = parseWorkbook(XLSX.write(wb, { type: 'array', bookType: 'xlsx' }) as ArrayBuffer);
    expect(grids).toHaveLength(2);
  });
});

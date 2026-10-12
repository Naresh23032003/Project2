import * as XLSX from '@e965/xlsx';
import type { Cell, Grid } from '../types';
import { parseDate } from './values';

// Date cells come back as ISO text from their serial number. Reading the displayed
// text instead would trust the cell's number format, and m/d/yy is the usual default.
function cellValue(cell: XLSX.CellObject | undefined): Cell {
  if (!cell) return '';
  if (cell.t === 'n') {
    if (cell.z && XLSX.SSF.is_date(String(cell.z))) return parseDate(cell.v as number) ?? (cell.v as number);
    return cell.v as number;
  }
  if (cell.t === 'd') return (cell.v as Date).toISOString().slice(0, 10);
  return cell.w ?? String(cell.v ?? '');
}

export function parseWorkbook(data: ArrayBuffer): Grid[] {
  const wb = XLSX.read(data, { type: 'array', cellNF: true, cellDates: false });
  return wb.SheetNames.map((name) => {
    const ws = wb.Sheets[name];
    if (!ws || !ws['!ref']) return [];
    const range = XLSX.utils.decode_range(ws['!ref']);
    const grid: Grid = [];
    for (let r = range.s.r; r <= range.e.r; r++) {
      const row: Cell[] = [];
      for (let c = range.s.c; c <= range.e.c; c++) {
        row.push(cellValue(ws[XLSX.utils.encode_cell({ r, c })] as XLSX.CellObject | undefined));
      }
      grid.push(row);
    }
    return grid;
  });
}

import * as XLSX from '@e965/xlsx';
import type { Grid } from '../../src/engine/types';

export type Row = { date: string; desc: string; amount: number; dir: 'debit' | 'credit'; src?: 'bank' | 'card' };
export type Layout = 'hdfc' | 'sbi' | 'icici' | 'axis' | 'kotak' | 'card';
export type Format = 'csv' | 'xlsx' | 'xls';
export type RenderedFile = { name: string; format: Format; csv?: string; bytes?: ArrayBuffer };

const MON = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
const inr = (n: number) => {
  const [w = '0', f = '00'] = n.toFixed(2).split('.');
  const last3 = w.slice(-3);
  const rest = w.slice(0, -3).replace(/\B(?=(\d{2})+(?!\d))/g, ',');
  return `${rest ? rest + ',' : ''}${last3}.${f}`;
};
const dmy = (d: string, sep: string, short = false) => `${d.slice(8, 10)}${sep}${d.slice(5, 7)}${sep}${short ? d.slice(2, 4) : d.slice(0, 4)}`;
const sbiDate = (d: string) => `${Number(d.slice(8, 10))} ${MON[Number(d.slice(5, 7)) - 1]} ${d.slice(0, 4)}`;

export function renderGrid(layout: Layout, rows: Row[]): Grid {
  const sorted = [...rows].sort((a, b) => (a.date < b.date ? -1 : a.date > b.date ? 1 : 0));
  let balance = 50000;
  const withBalance = sorted.map((r) => {
    balance += r.dir === 'credit' ? r.amount : -r.amount;
    return { ...r, balance };
  });
  const first = sorted[0]?.date ?? '2024-01-01';
  const last = sorted[sorted.length - 1]?.date ?? '2024-01-01';

  switch (layout) {
    case 'hdfc':
      return [
        ['Mr TEST PERSON', '', '', '', '', '', ''],
        ['Account Branch : ANDHERI WEST', '', '', '', '', '', ''],
        ['IFSC : HDFC0000123  MICR : 400240001', '', '', '', '', '', ''],
        [`Statement From : ${dmy(first, '/')} To : ${dmy(last, '/')}`, '', '', '', '', '', ''],
        [],
        ['Date', 'Narration', 'Chq./Ref.No.', 'Value Dt', 'Withdrawal Amt.', 'Deposit Amt.', 'Closing Balance'],
        ['********', '********', '********', '********', '********', '********', '********'],
        ...withBalance.map((r) => [dmy(r.date, '/', true), r.desc, '0000' + r.desc.length, dmy(r.date, '/', true), r.dir === 'debit' ? inr(r.amount) : '', r.dir === 'credit' ? inr(r.amount) : '', inr(r.balance)]),
        [],
        ['STATEMENT SUMMARY :-', '', '', '', '', '', ''],
        ['Opening Balance', 'Dr Count', 'Cr Count', 'Debits', 'Credits', 'Closing Bal', ''],
      ];
    case 'sbi':
      return [
        ['Account Name :', 'MR TEST PERSON'],
        ['Branch :', 'SBIN0001234'],
        ['Txn Date', 'Value Date', 'Description', 'Ref No./Cheque No.', 'Debit', 'Credit', 'Balance'],
        ...withBalance.map((r) => [sbiDate(r.date), sbiDate(r.date), r.desc, 'TRANSFER', r.dir === 'debit' ? inr(r.amount) : '', r.dir === 'credit' ? inr(r.amount) : '', inr(r.balance) + ' CR']),
      ];
    case 'icici':
      return [
        ['Detailed Statement'],
        ['Transactions List - Mr TEST PERSON - 000000123456 (INR)'],
        ['S No.', 'Value Date', 'Transaction Date', 'Cheque Number', 'Transaction Remarks', 'Withdrawal Amount (INR)', 'Deposit Amount (INR)', 'Balance (INR)'],
        ...withBalance.map((r, i) => [i + 1, dmy(r.date, '/'), dmy(r.date, '/'), '-', r.desc, r.dir === 'debit' ? r.amount : 0, r.dir === 'credit' ? r.amount : 0, r.balance]),
      ];
    case 'axis':
      return [
        [`Statement of Account No - 912010012345678 for the period (From : ${dmy(first, '-')} To : ${dmy(last, '-')})`],
        ['Tran Date', 'CHQNO', 'PARTICULARS', 'DR', 'CR', 'BAL', 'SOL'],
        ...withBalance.map((r) => [dmy(r.date, '-'), '', r.desc, r.dir === 'debit' ? inr(r.amount) : '', r.dir === 'credit' ? inr(r.amount) : '', inr(r.balance), '6001']),
      ];
    case 'kotak':
      return [
        ['Kotak Mahindra Bank'],
        ['Account Statement'],
        ['Sl. No.', 'Transaction Date', 'Value Date', 'Description', 'Chq / Ref No.', 'Amount', 'Dr / Cr', 'Balance'],
        ...withBalance.map((r, i) => [i + 1, dmy(r.date, '-'), dmy(r.date, '-'), r.desc, '', inr(r.amount), r.dir === 'debit' ? 'DR' : 'CR', inr(r.balance)]),
      ];
    case 'card':
      return [
        ['Credit Card Statement'],
        ['Date', 'Transaction Description', 'Amount (in Rs.)', 'Dr/Cr'],
        ...sorted.map((r) => [dmy(r.date, '/'), r.desc, inr(r.amount), r.dir === 'debit' ? 'Dr' : 'Cr']),
      ];
  }
}

function toCsv(grid: Grid): string {
  const esc = (c: unknown) => {
    const s = String(c ?? '');
    return /[",\n]/.test(s) ? `"${s.replace(/"/g, '""')}"` : s;
  };
  return grid.map((r) => r.map(esc).join(',')).join('\n') + '\n';
}

export function renderFile(name: string, layout: Layout, format: Format, rows: Row[]): RenderedFile {
  const grid = renderGrid(layout, rows);
  if (format === 'csv') return { name, format, csv: toCsv(grid) };
  const ws = XLSX.utils.aoa_to_sheet(grid as unknown[][]);
  const wb = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(wb, ws, 'Statement');
  const bytes = XLSX.write(wb, { type: 'array', bookType: format === 'xls' ? 'biff8' : 'xlsx' }) as ArrayBuffer;
  return { name, format, bytes };
}

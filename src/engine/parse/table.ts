import type { Bank, Cell, ColumnMapping, Grid, ParsedTable, TableResult, Txn } from '../types';
import { inferDateOrder, parseAmount, parseDate, type DateOrder } from './values';

export type TableOptions = {
  source: string;
  mapping?: ColumnMapping;
  dateOrder?: DateOrder;
  flip?: boolean;
};

type Kind = 'date' | 'valueDate' | 'desc' | 'debit' | 'credit' | 'amount' | 'type' | 'balance' | 'ref';

const HEADER_SCAN_ROWS = 60;
const FOOTER = /^(statement summary|opening balance|closing balance|total\b|grand total|end of statement|this is a computer|generated on|page \d)/i;

const key = (c: Cell): string => String(c ?? '').toLowerCase().replace(/[^a-z0-9]/g, '');
const text = (c: Cell): string => String(c ?? '').trim();
const isBlank = (c: Cell): boolean => text(c) === '';

const DATE_NAMES = new Set(['date', 'txndate', 'trandate', 'transactiondate', 'transdate', 'postingdate', 'transactionposteddate', 'bookingdate', 'tdate', 'txdate']);
const DESC_NAMES = new Set(['narration', 'description', 'particulars', 'transactionremarks', 'remarks', 'details', 'transactiondetails', 'transactiondescription', 'narrative', 'descriptionofthetransaction', 'transactionnarration']);
const TYPE_NAMES = new Set(['drcr', 'crdr', 'debitcredit', 'creditdebit', 'type', 'transactiontype', 'crdrindicator', 'drcrindicator', 'creditdebitindicator']);

function classify(cell: Cell): Kind | null {
  const k = key(cell);
  if (!k) return null;
  if (/^(valuedate|valuedt|valdate|valuedat)/.test(k)) return 'valueDate';
  if (DATE_NAMES.has(k)) return 'date';
  if (DESC_NAMES.has(k)) return 'desc';
  if (TYPE_NAMES.has(k)) return 'type';
  const hasOut = /withdrawal|debit/.test(k);
  const hasIn = /deposit|credit/.test(k);
  if (hasOut && hasIn) return 'amount';
  if (/^(withdrawal|debit)/.test(k) || k === 'dr') return 'debit';
  if (/^(deposit|credit)/.test(k) || k === 'cr') return 'credit';
  if (/^(amount|transactionamount|amt)/.test(k)) return 'amount';
  if (/^(balance|closingbalance|runningbalance|bal)/.test(k)) return 'balance';
  if (/chq|cheque|^ref/.test(k)) return 'ref';
  return null;
}

function detectMapping(grid: Grid): ColumnMapping | null {
  for (let i = 0; i < Math.min(grid.length, HEADER_SCAN_ROWS); i++) {
    const row = grid[i] ?? [];
    const found: Partial<Record<Kind, number>> = {};
    row.forEach((cell, col) => {
      const kind = classify(cell);
      if (kind && found[kind] === undefined) found[kind] = col;
    });
    const date = found.date ?? found.valueDate;
    const hasAmount = found.debit !== undefined || found.credit !== undefined || found.amount !== undefined;
    if (date === undefined || found.desc === undefined || !hasAmount) continue;
    return {
      headerRow: i,
      date,
      desc: found.desc,
      debit: found.debit,
      credit: found.credit,
      amount: found.amount,
      type: found.type,
      balance: found.balance,
      ref: found.ref,
    };
  }
  return null;
}

function detectBank(grid: Grid, headerRow: number): Bank | undefined {
  const head = grid.slice(0, headerRow + 1).flat().map(text).join(' ').toUpperCase();
  if (/HDFC0[A-Z0-9]{6}|HDFC BANK/.test(head)) return 'hdfc';
  if (/SBIN0[A-Z0-9]{6}|STATE BANK OF INDIA/.test(head)) return 'sbi';
  if (/ICIC0[A-Z0-9]{6}|ICICI BANK/.test(head)) return 'icici';
  if (/UTIB0[A-Z0-9]{6}|AXIS BANK/.test(head)) return 'axis';
  if (/KKBK0[A-Z0-9]{6}|KOTAK/.test(head)) return 'kotak';
  const header = (grid[headerRow] ?? []).map(key).join('|');
  if (header.includes('withdrawalamt') && header.includes('closingbalance')) return 'hdfc';
  if (header.includes('trandate') && header.includes('particulars')) return 'axis';
  if (header.includes('transactionremarks')) return 'icici';
  if (header.includes('txndate')) return 'sbi';
  return undefined;
}

function directionFromMarker(marker: string): 'debit' | 'credit' | undefined {
  const m = marker.trim().toLowerCase();
  if (/^(dr|debit|d|withdrawal|w)\b/.test(m)) return 'debit';
  if (/^(cr|credit|c|deposit)\b/.test(m)) return 'credit';
  return undefined;
}

type Pending = { txn: Txn; signedNegative?: boolean };

export function parseGrid(grid: Grid, opts: TableOptions): TableResult {
  const mapping = opts.mapping ?? detectMapping(grid);
  if (!mapping) {
    const guess = grid.findIndex((r) => r.filter((c) => !isBlank(c)).length >= 3);
    return { status: 'needsMapping', grid, headerGuess: guess === -1 ? undefined : guess };
  }

  const warnings: string[] = [];
  const dataRows = grid.slice(mapping.headerRow + 1);
  const samples = dataRows.map((r) => text(r[mapping.date])).filter(Boolean);
  const dateOrder: DateOrder = opts.dateOrder ?? inferDateOrder(samples);
  if (dateOrder === 'mdy' && !opts.dateOrder) warnings.push('The dates look month first (MM/DD), so I read them that way.');

  const pending: Pending[] = [];
  let skippedRows = 0;

  for (let i = mapping.headerRow + 1; i < grid.length; i++) {
    const row = grid[i] ?? [];
    if (row.every(isBlank)) continue;
    const firstText = text(row.find((c) => !isBlank(c)));
    if (pending.length > 0 && FOOTER.test(firstText)) break;

    const dateCell = row[mapping.date];
    const date = parseDate(typeof dateCell === 'number' ? dateCell : text(dateCell), dateOrder);
    const desc = text(row[mapping.desc]);

    const debit = mapping.debit !== undefined ? parseAmount(row[mapping.debit] ?? '') : null;
    const credit = mapping.credit !== undefined ? parseAmount(row[mapping.credit] ?? '') : null;
    const single = mapping.amount !== undefined ? parseAmount(row[mapping.amount] ?? '') : null;
    const hasAmountCell = [mapping.debit, mapping.credit, mapping.amount].some((c) => c !== undefined && !isBlank(row[c]));

    if (!date) {
      const prev = pending[pending.length - 1];
      if (isBlank(dateCell) && !hasAmountCell && desc && prev) prev.txn.desc += ' ' + desc;
      else if (hasAmountCell) skippedRows++;
      continue;
    }

    let amount = 0;
    let direction: 'debit' | 'credit' | undefined;
    let signedNegative: boolean | undefined;
    if (debit && debit.paise > 0) {
      amount = debit.paise;
      direction = 'debit';
    } else if (credit && credit.paise > 0) {
      amount = credit.paise;
      direction = 'credit';
    } else if (single && single.paise > 0) {
      amount = single.paise;
      const marker = mapping.type !== undefined ? directionFromMarker(text(row[mapping.type])) : undefined;
      direction = single.side ? (single.side === 'dr' ? 'debit' : 'credit') : marker;
      if (!direction) signedNegative = single.negative;
    }
    if (amount === 0) continue;

    const balance = mapping.balance !== undefined ? parseAmount(row[mapping.balance] ?? '')?.paise : undefined;
    const refText = mapping.ref !== undefined ? text(row[mapping.ref]) : '';
    const txn: Txn = {
      id: `${opts.source}#${i}`,
      date,
      desc,
      amount,
      direction: direction ?? 'debit',
      source: opts.source,
    };
    if (balance !== undefined) txn.balance = balance;
    if (refText && refText !== '-') txn.ref = refText;
    pending.push({ txn, signedNegative });
  }

  const signed = pending.filter((p) => p.signedNegative !== undefined);
  if (signed.length > 0) {
    const negatives = signed.filter((p) => p.signedNegative).length;
    const negativeIsDebit = negatives >= signed.length - negatives;
    for (const p of signed) p.txn.direction = p.signedNegative === negativeIsDebit ? 'debit' : 'credit';
  }
  if (opts.flip) {
    for (const p of pending) p.txn.direction = p.txn.direction === 'debit' ? 'credit' : 'debit';
  }

  const result: ParsedTable = {
    status: 'ok',
    txns: pending.map((p) => p.txn),
    skippedRows,
    warnings,
    bank: detectBank(grid, mapping.headerRow),
    dateOrder,
    mapping,
  };
  return result;
}

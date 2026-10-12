export type Rail = 'upi' | 'card' | 'nach' | 'si' | 'neft' | 'imps' | 'other';
export type Cadence = 'weekly' | 'monthly' | 'quarterly' | 'yearly';
export type Confidence = 'sure' | 'likely' | 'maybe';
export type MerchantKind = 'subscription' | 'appstore' | 'telecom' | 'variable' | 'finance';

export type Merchant = {
  id: string;
  name: string;
  kind: MerchantKind;
  patterns: string[];
  cadence?: Cadence;
};

export type Normalized = {
  key: string;
  display: string;
  rail: Rail;
  mandate: boolean;
  person: boolean;
  knownId?: string;
};

export type Txn = {
  id: string;
  date: string;
  desc: string;
  amount: number;
  direction: 'debit' | 'credit';
  balance?: number;
  ref?: string;
  source: string;
};

export type Cell = string | number | null | undefined;
export type Grid = Cell[][];
export type Bank = 'hdfc' | 'sbi' | 'icici' | 'axis' | 'kotak';

export type ColumnMapping = {
  headerRow: number;
  date: number;
  desc: number;
  debit?: number;
  credit?: number;
  amount?: number;
  type?: number;
  balance?: number;
  ref?: number;
};

export type ParsedTable = {
  status: 'ok';
  txns: Txn[];
  skippedRows: number;
  warnings: string[];
  bank?: Bank;
  dateOrder: 'dmy' | 'mdy';
  mapping: ColumnMapping;
};
export type NeedsMapping = { status: 'needsMapping'; grid: Grid; headerGuess?: number };
export type TableResult = ParsedTable | NeedsMapping;

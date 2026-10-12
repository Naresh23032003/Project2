import { detect, type DetectOptions } from './detect';
import { monthIndex } from './dates';
import { mergeTxns } from './merge';
import type { Recurring, Txn } from './types';

export type Analysis = { txns: Txn[]; recurring: Recurring[]; start: string; end: string; months: number };

export function analyze(files: Txn[][], opts: DetectOptions = {}): Analysis {
  const txns = mergeTxns(files);
  const first = txns[0];
  const last = txns[txns.length - 1];
  if (!first || !last) return { txns, recurring: [], start: '', end: '', months: 0 };
  return {
    txns,
    recurring: detect(txns, opts),
    start: first.date,
    end: last.date,
    months: monthIndex(last.date) - monthIndex(first.date),
  };
}

export { summarize } from './summary';
export type { Decision, Summary } from './summary';

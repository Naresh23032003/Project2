import { detect, type DetectOptions } from './detect';
import { monthIndex } from './dates';
import { mergeTxns } from './merge';
import type { Recurring, Txn } from './types';

export type Decision = 'keep' | 'cancel' | 'not';
export type Analysis = { txns: Txn[]; recurring: Recurring[]; start: string; end: string; months: number };
export type Summary = {
  yearlyTotal: number;
  count: number;
  maybeCount: number;
  otherCount: number;
  stoppedCount: number;
  potentialSavings: number;
};

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

export function summarize(items: Recurring[], decisions: Record<string, Decision>): Summary {
  const s: Summary = { yearlyTotal: 0, count: 0, maybeCount: 0, otherCount: 0, stoppedCount: 0, potentialSavings: 0 };
  for (const r of items) {
    const decision = decisions[r.id];
    if (decision === 'not') continue;
    if (r.category !== 'subscription') {
      s.otherCount++;
      continue;
    }
    if (r.status === 'stopped') {
      s.stoppedCount++;
      continue;
    }
    if (decision === 'cancel') s.potentialSavings += r.yearlyCost;
    if (r.confidence === 'maybe') {
      s.maybeCount++;
    } else {
      s.yearlyTotal += r.yearlyCost;
      s.count++;
    }
  }
  return s;
}

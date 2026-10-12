import type { Recurring } from './types';

export type Decision = 'keep' | 'cancel' | 'not';
export type Summary = {
  yearlyTotal: number;
  count: number;
  maybeCount: number;
  otherCount: number;
  stoppedCount: number;
  potentialSavings: number;
};

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

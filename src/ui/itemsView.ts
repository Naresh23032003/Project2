import { formatRupees } from '../engine/format';
import { monthName } from '../engine/labels';
import type { Confidence, Recurring } from '../engine/types';

export type Filter = 'all' | 'sure' | 'likely' | 'maybe' | 'forgotten' | 'price' | 'stopped';
export type SortKey = 'cost' | 'name' | 'last' | 'next' | 'confidence';
export type SortDir = 'asc' | 'desc';

const RANK: Record<Confidence, number> = { sure: 3, likely: 2, maybe: 1 };

const MATCH: Record<Filter, (r: Recurring) => boolean> = {
  all: () => true,
  sure: (r) => r.confidence === 'sure',
  likely: (r) => r.confidence === 'likely',
  maybe: (r) => r.confidence === 'maybe',
  forgotten: (r) => r.forgotten,
  price: (r) => r.priceChanges.length > 0,
  stopped: (r) => r.status === 'stopped',
};

export const filterItems = (items: Recurring[], f: Filter): Recurring[] => items.filter(MATCH[f]);

export function countFilters(items: Recurring[]): Record<Filter, number> {
  const out = { all: 0, sure: 0, likely: 0, maybe: 0, forgotten: 0, price: 0, stopped: 0 };
  for (const r of items) for (const f of Object.keys(out) as Filter[]) if (MATCH[f](r)) out[f]++;
  return out;
}

export function sortItems(items: Recurring[], key: SortKey, dir: SortDir): Recurring[] {
  const sign = dir === 'asc' ? 1 : -1;
  const by: Record<SortKey, (a: Recurring, b: Recurring) => number> = {
    cost: (a, b) => a.yearlyCost - b.yearlyCost,
    name: (a, b) => a.display.localeCompare(b.display),
    last: (a, b) => a.lastDate.localeCompare(b.lastDate),
    next: (a, b) => a.nextExpected.localeCompare(b.nextExpected),
    confidence: (a, b) => RANK[a.confidence] - RANK[b.confidence] || a.yearlyCost - b.yearlyCost,
  };
  return [...items].sort((a, b) => {
    // Stopped items never lead a cost ranking: they are no longer costing anything.
    if (key === 'cost' && a.status !== b.status) return a.status === 'stopped' ? 1 : -1;
    return sign * by[key](a, b) || a.display.localeCompare(b.display);
  });
}

export function priceAlerts(items: Recurring[]): { id: string; text: string }[] {
  const out: { id: string; text: string }[] = [];
  for (const r of items) {
    if (r.status === 'stopped') continue;
    for (const c of r.priceChanges) {
      const verb = c.to > c.from ? 'went' : 'dropped';
      out.push({ id: r.id, text: `${r.display} ${verb} from ${formatRupees(c.from)} to ${formatRupees(c.to)} in ${monthName(c.date)}.` });
    }
  }
  return out;
}

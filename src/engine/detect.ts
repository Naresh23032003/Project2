import merchantData from '../data/merchants.json';
import { classify } from './classify';
import { CONFIG as C } from './config';
import { addDays, addMonths, dayOfMonth, daysBetween } from './dates';
import { formatRupees, ordinal } from './format';
import { normalize } from './normalize';
import { jaroWinkler } from './similarity';
import type { Cadence, Confidence, Merchant, Normalized, Recurring, Txn } from './types';

export type DetectOptions = { merchants?: Merchant[]; asOf?: string };

type Item = { txn: Txn; norm: Normalized };
type Fit = { cadence: Cadence; indexes: number[]; missed: number; coverage: number };

const CADENCES: Cadence[] = ['monthly', 'weekly', 'quarterly', 'yearly'];
const UNIT_MONTHS: Record<Cadence, number> = { weekly: 0, monthly: 1, quarterly: 3, yearly: 12 };

const byDate = (a: Item, b: Item) =>
  a.txn.date < b.txn.date ? -1 : a.txn.date > b.txn.date ? 1 : a.txn.amount - b.txn.amount || (a.txn.id < b.txn.id ? -1 : 1);

function median(values: number[]): number {
  const s = [...values].sort((a, b) => a - b);
  const mid = Math.floor(s.length / 2);
  return s.length % 2 ? (s[mid] as number) : Math.round(((s[mid - 1] as number) + (s[mid] as number)) / 2);
}

function removeReversals(items: Item[]): Item[] {
  const credits = items.filter((i) => i.txn.direction === 'credit').sort(byDate);
  const used = new Set<string>();
  const debits = items.filter((i) => i.txn.direction === 'debit').sort(byDate);
  const dropped = new Set<string>();
  for (const d of debits) {
    const match = credits.find(
      (c) =>
        !used.has(c.txn.id) &&
        c.norm.key === d.norm.key &&
        c.txn.amount === d.txn.amount &&
        daysBetween(d.txn.date, c.txn.date) >= 0 &&
        daysBetween(d.txn.date, c.txn.date) <= C.reversalWindowDays,
    );
    if (match) {
      used.add(match.txn.id);
      dropped.add(d.txn.id);
    }
  }
  return debits.filter((d) => !dropped.has(d.txn.id));
}

function sameMerchant(a: string, b: string): boolean {
  if (/\d/.test(a) || /\d/.test(b)) return false;
  if (jaroWinkler(a, b) >= C.fuzzyMerge) return true;
  const [short, long] = a.length <= b.length ? [a, b] : [b, a];
  return short.length >= C.fuzzyPrefixMin && long.startsWith(short);
}

function groupItems(items: Item[]): Item[][] {
  const byKey = new Map<string, Item[]>();
  for (const it of items) {
    if (!it.norm.key) continue;
    const list = byKey.get(it.norm.key);
    if (list) list.push(it);
    else byKey.set(it.norm.key, [it]);
  }
  const parent = new Map<string, string>();
  const find = (k: string): string => {
    let r = k;
    while (parent.get(r) !== r) r = parent.get(r) as string;
    return r;
  };
  const unknown: string[] = [];
  for (const [k, list] of byKey) {
    parent.set(k, k);
    if (!(list[0] as Item).norm.knownId) unknown.push(k);
  }
  const buckets = new Map<string, string[]>();
  for (const k of unknown.sort()) {
    const b = k.slice(0, 3);
    const list = buckets.get(b);
    if (list) list.push(k);
    else buckets.set(b, [k]);
  }
  for (const keys of buckets.values()) {
    for (let i = 0; i < keys.length; i++) {
      for (let j = i + 1; j < keys.length; j++) {
        if (sameMerchant(keys[i] as string, keys[j] as string)) parent.set(find(keys[j] as string), find(keys[i] as string));
      }
    }
  }
  const merged = new Map<string, Item[]>();
  for (const [k, list] of byKey) {
    const root = find(k);
    const target = merged.get(root);
    if (target) target.push(...list);
    else merged.set(root, [...list]);
  }
  return [...merged.values()];
}

function fitCadence(dates: string[], cadence: Cadence): Fit | null {
  const unit = UNIT_MONTHS[cadence];
  const drift = C.driftDays[cadence];
  let best: Fit | null = null;
  let start = 0;
  let missed = 0;
  let units = 0;

  const close = (end: number) => {
    const hits = end - start + 1;
    if (hits < 2) return;
    if (!best || hits >= best.indexes.length) {
      best = {
        cadence,
        indexes: Array.from({ length: hits }, (_, i) => start + i),
        missed,
        coverage: hits / (hits + missed),
      };
    }
  };

  for (let i = 1; i <= dates.length; i++) {
    let ok = false;
    let k = 0;
    if (i < dates.length) {
      const prev = dates[i - 1] as string;
      const cur = dates[i] as string;
      const gap = daysBetween(prev, cur);
      k = Math.round(unit === 0 ? gap / 7 : gap / (30.4375 * unit));
      if (k >= 1 && k <= 2) {
        let err: number;
        if (unit === 0) err = Math.abs(gap - 7 * k);
        else {
          const chain = Math.abs(daysBetween(addMonths(prev, unit * k), cur));
          const anchor = Math.abs(daysBetween(addMonths(dates[start] as string, unit * (units + k)), cur));
          err = Math.min(chain, anchor);
        }
        ok = err <= drift;
      }
    }
    if (ok) {
      missed += k - 1;
      units += k;
    } else {
      close(i - 1);
      start = i;
      missed = 0;
      units = 0;
    }
  }
  return best;
}

function bestFit(dates: string[]): Fit | null {
  let best: Fit | null = null;
  for (const c of CADENCES) {
    const f = fitCadence(dates, c);
    if (!f || f.coverage < C.minCoverage) continue;
    if (!best || f.indexes.length > best.indexes.length || (f.indexes.length === best.indexes.length && f.coverage > best.coverage)) best = f;
  }
  return best;
}

function uniqueByDate(items: Item[]): Item[] {
  const seen = new Set<string>();
  return items.filter((i) => (seen.has(i.txn.date) ? false : (seen.add(i.txn.date), true)));
}

function clusterByAmount(sorted: Item[]): Item[][] {
  const clusters: Item[][] = [];
  for (const it of sorted) {
    let target: Item[] | undefined;
    let bestDiff = Infinity;
    for (const c of clusters) {
      const last = (c[c.length - 1] as Item).txn.amount;
      const tol = Math.max(C.amountToleranceMin, C.amountTolerancePct * last);
      const diff = Math.abs(it.txn.amount - last);
      if (diff <= tol && diff < bestDiff) {
        target = c;
        bestDiff = diff;
      }
    }
    if (target) target.push(it);
    else clusters.push([it]);
  }
  return clusters;
}

function mergeSequential(clusters: Item[][]): Item[][] {
  const sorted = [...clusters].sort((a, b) => byDate(a[0] as Item, b[0] as Item));
  const out: Item[][] = [];
  for (const b of sorted) {
    let merged = false;
    const bMedian = median(b.map((i) => i.txn.amount));
    for (const a of out) {
      const last = (a[a.length - 1] as Item).txn.date;
      if (last >= (b[0] as Item).txn.date) continue;
      const ratio = bMedian / median(a.map((i) => i.txn.amount));
      if (ratio > C.priceChangeMaxRatio || ratio < 1 / C.priceChangeMaxRatio) continue;
      const combined = uniqueByDate([...a, ...b]);
      const fit = bestFit(combined.map((i) => i.txn.date));
      if (fit && fit.indexes.length === combined.length) {
        a.push(...b);
        merged = true;
        break;
      }
    }
    if (!merged) out.push([...b]);
  }
  return out;
}

function stableFraction(amounts: number[]): number {
  if (amounts.length < 2) return 1;
  let same = 0;
  for (let i = 1; i < amounts.length; i++) {
    const a = amounts[i - 1] as number;
    const b = amounts[i] as number;
    if (Math.abs(b - a) <= Math.max(C.samePriceMin, C.samePricePct * a)) same++;
  }
  return same / (amounts.length - 1);
}

function nextDate(last: string, cadence: Cadence): string {
  return cadence === 'weekly' ? addDays(last, 7) : addMonths(last, UNIT_MONTHS[cadence]);
}

function describeCadence(cadence: Cadence, hits: Item[], fit: Fit): string {
  const n = hits.length;
  const span = n + fit.missed;
  if (cadence === 'weekly') return `Charged every 7 days, ${n} times`;
  if (cadence === 'yearly') return n === 2 ? 'Charged twice, a year apart' : `Charged once a year, ${n} years in a row`;
  const day = median(hits.map((h) => dayOfMonth(h.txn.date)));
  const every = cadence === 'monthly' ? 'each month' : 'every 3 months';
  const unit = cadence === 'monthly' ? 'months' : 'quarters';
  const lead = `Charged around the ${ordinal(day)} ${every}`;
  return fit.missed > 0
    ? `${lead}, ${n} times over ${span} ${unit} (${fit.missed} missed)`
    : `${lead}, ${n} ${unit} in a row`;
}

function toRecurring(
  id: string,
  group: Item[],
  hits: Item[],
  fit: Fit,
  merchant: Merchant | undefined,
  asOf: string,
  score: number,
  confidence: Confidence,
  extraReasons: string[],
): Recurring {
  const { cadence } = fit;
  const amounts = hits.map((h) => h.txn.amount);
  const typical = median(amounts.slice(-3));
  const last = (hits[hits.length - 1] as Item).txn.date;
  const next = nextDate(last, cadence);
  const grace = Math.max(C.graceMinDays, C.gracePct * C.periodDays[cadence]);
  const status = daysBetween(next, asOf) <= grace ? 'active' : 'stopped';

  const priceChanges: Recurring['priceChanges'] = [];
  const stable = stableFraction(amounts);
  if (stable >= C.minStableFraction) {
    for (let i = 1; i < hits.length; i++) {
      const a = amounts[i - 1] as number;
      const b = amounts[i] as number;
      if (Math.abs(b - a) > Math.max(C.samePriceMin, C.samePricePct * a)) priceChanges.push({ date: (hits[i] as Item).txn.date, from: a, to: b });
    }
  }

  const reasons = [describeCadence(cadence, hits, fit)];
  if (priceChanges.length === 0 && stable >= C.sureStableFraction) reasons.push(`Same amount each time (${formatRupees(typical)})`);
  else if (priceChanges.length === 0) reasons.push('The amount changes from charge to charge');
  for (const p of priceChanges) reasons.push(`Price went from ${formatRupees(p.from)} to ${formatRupees(p.to)} on ${p.date}`);
  reasons.push(...extraReasons);

  const yearlyCost = typical * C.periodsPerYear[cadence];
  const category = classify(
    hits.map((h) => h.txn),
    hits.map((h) => h.norm),
    merchant,
  );
  const first = hits[0] as Item;
  return {
    id,
    merchantKey: first.norm.knownId ?? first.norm.key,
    display: merchant?.name ?? mostCommon(group.map((g) => g.norm.display)),
    knownId: merchant?.id,
    cadence,
    typicalAmount: typical,
    yearlyCost,
    hits: hits.map((h) => h.txn),
    firstDate: first.txn.date,
    lastDate: last,
    nextExpected: next,
    status,
    confidence,
    score,
    reasons,
    priceChanges,
    missed: fit.missed,
    forgotten:
      category === 'subscription' && status === 'active' && (yearlyCost / 12 <= C.forgottenMonthlyMax || cadence === 'yearly'),
    category,
  };
}

function mostCommon(values: string[]): string {
  const counts = new Map<string, number>();
  for (const v of values) counts.set(v, (counts.get(v) ?? 0) + 1);
  return [...counts.entries()].sort((a, b) => b[1] - a[1] || (a[0] < b[0] ? -1 : 1))[0]?.[0] ?? '';
}

export function detect(txns: Txn[], opts: DetectOptions = {}): Recurring[] {
  const merchants = opts.merchants ?? (merchantData as Merchant[]);
  const byId = new Map(merchants.map((m) => [m.id, m]));
  const asOf = opts.asOf ?? txns.reduce((max, t) => (t.date > max ? t.date : max), '0000-00-00');
  const items: Item[] = txns.map((txn) => ({ txn, norm: normalize(txn.desc, merchants) }));
  const debits = removeReversals(items);

  const results: Recurring[] = [];
  for (const group of groupItems(debits)) {
    const sorted = [...group].sort(byDate);
    const knownId = sorted.find((i) => i.norm.knownId)?.norm.knownId;
    const merchant = knownId ? byId.get(knownId) : undefined;
    const groupKey = merchant?.id ?? mostCommon(sorted.map((i) => i.norm.key));

    const evaluate = (n: number, unique: Item[], fit: Fit): Recurring | null => {
      const hits = fit.indexes.map((i) => unique[i] as Item);
      const mandate = hits.some((h) => h.norm.mandate);
      const knownSub = merchant?.kind === 'subscription' || merchant?.kind === 'telecom';
      const variable = merchant?.kind === 'variable';
      const signal = mandate || knownSub;
      const need = (signal ? C.minHitsWithSignal[fit.cadence] : C.minHits[fit.cadence]) + (variable && !mandate ? C.variableExtraHits : 0);
      if (hits.length < need) return null;
      if (!signal && sorted.length >= C.busyMerchantCharges && hits.length / sorted.length < C.busyMerchantMinShare) return null;

      const stable = stableFraction(hits.map((h) => h.txn.amount));
      if (stable < C.minStableFraction && !signal) return null;
      if (variable && !mandate && stable < C.sureStableFraction) return null;

      let score = 40 * fit.coverage + Math.min(20, hits.length * 4) + 15 * stable;
      if (mandate) score += 10;
      if (knownSub) score += 15;
      else if (merchant?.kind === 'appstore') score += 5;
      score = Math.round(score);
      if (score < C.score.maybe) return null;

      let confidence: Confidence = score >= C.score.sure ? 'sure' : score >= C.score.likely ? 'likely' : 'maybe';
      const sureOk = hits.length >= 3 && signal && stable >= C.sureStableFraction && !variable;
      if (confidence === 'sure' && !sureOk) confidence = 'likely';
      if (stable < C.minStableFraction) confidence = 'maybe';

      const extra: string[] = [];
      if (mandate) extra.push('Taken through an autopay or mandate');
      if (knownSub && merchant) extra.push(`${merchant.name} is a known subscription service`);
      return toRecurring(`${groupKey}#${n}`, sorted, hits, fit, merchant, asOf, score, confidence, extra);
    };

    let found = 0;
    const whole = uniqueByDate(sorted);
    if (whole.length === sorted.length && whole.length >= 2) {
      const fit = bestFit(whole.map((i) => i.txn.date));
      if (fit && fit.indexes.length >= Math.ceil(C.wholeSeriesCoverage * whole.length)) {
        const r = evaluate(0, whole, fit);
        if (r) {
          results.push(r);
          continue;
        }
      }
    }

    mergeSequential(clusterByAmount(sorted)).forEach((cluster, n) => {
      const unique = uniqueByDate(cluster);
      const fit = bestFit(unique.map((i) => i.txn.date));
      if (!fit) return;
      const r = evaluate(n, unique, fit);
      if (r) {
        results.push(r);
        found++;
      }
    });

    if (found === 0 && merchant?.kind === 'subscription' && sorted.length === 1) {
      const only = sorted[0] as Item;
      const cadence: Cadence = merchant.cadence ?? 'monthly';
      const fit: Fit = { cadence, indexes: [0], missed: 0, coverage: 1 };
      const reasons = [`One charge from ${merchant.name}, which usually bills ${cadence === 'yearly' ? 'once a year' : cadence}. More statements would confirm it`];
      const r = toRecurring(`${groupKey}#0`, sorted, [only], fit, merchant, asOf, C.score.singleHit, 'maybe', []);
      r.reasons = reasons;
      results.push(r);
    }
  }

  return results.sort((a, b) => b.yearlyCost - a.yearlyCost || (a.display < b.display ? -1 : a.display > b.display ? 1 : 0) || (a.id < b.id ? -1 : 1));
}

import type { Txn } from './types';

const PREFIX_LEN = 16;

function keyOf(t: Txn): string {
  const prefix = t.desc.toUpperCase().replace(/[^A-Z0-9]/g, '').slice(0, PREFIX_LEN);
  return `${t.date}|${t.amount}|${t.direction}|${prefix}`;
}

export function mergeTxns(files: Txn[][]): Txn[] {
  const kept = new Map<string, Txn[]>();
  for (const file of files) {
    const inFile = new Map<string, Txn[]>();
    for (const t of file) {
      const k = keyOf(t);
      const list = inFile.get(k);
      if (list) list.push(t);
      else inFile.set(k, [t]);
    }
    for (const [k, list] of inFile) {
      const existing = kept.get(k) ?? [];
      if (list.length > existing.length) kept.set(k, existing.concat(list.slice(existing.length)));
    }
  }
  return [...kept.values()].flat().sort((a, b) => (a.date < b.date ? -1 : a.date > b.date ? 1 : 0));
}

import { describe, expect, it } from 'vitest';
import { mergeTxns } from '../../src/engine/merge';
import type { Txn } from '../../src/engine/types';

let n = 0;
const t = (date: string, desc: string, amount: number, source: string, direction: Txn['direction'] = 'debit'): Txn => ({
  id: `${source}#${n++}`,
  date,
  desc,
  amount,
  direction,
  source,
});

describe('mergeTxns', () => {
  it('sorts by date', () => {
    const merged = mergeTxns([[t('2024-02-01', 'B', 100, 'a'), t('2024-01-01', 'A', 100, 'a')]]);
    expect(merged.map((x) => x.date)).toEqual(['2024-01-01', '2024-02-01']);
  });

  it('drops a transaction that appears in two overlapping statements', () => {
    const jan = [t('2024-01-05', 'NETFLIX', 19900, 'jan.csv'), t('2024-01-31', 'SPOTIFY', 11900, 'jan.csv')];
    const janFeb = [t('2024-01-31', 'SPOTIFY', 11900, 'janfeb.csv'), t('2024-02-05', 'NETFLIX', 19900, 'janfeb.csv')];
    const merged = mergeTxns([jan, janFeb]);
    expect(merged.map((x) => [x.date, x.desc])).toEqual([
      ['2024-01-05', 'NETFLIX'],
      ['2024-01-31', 'SPOTIFY'],
      ['2024-02-05', 'NETFLIX'],
    ]);
  });

  it('keeps two identical charges on the same day inside one file', () => {
    const file = [t('2024-03-01', 'GOOGLE PLAY', 12900, 'a'), t('2024-03-01', 'GOOGLE PLAY', 12900, 'a')];
    expect(mergeTxns([file]).length).toBe(2);
  });

  it('keeps both when the second file has more identical charges than the first', () => {
    const a = [t('2024-03-01', 'GOOGLE PLAY', 12900, 'a')];
    const b = [t('2024-03-01', 'GOOGLE PLAY', 12900, 'b'), t('2024-03-01', 'GOOGLE PLAY', 12900, 'b')];
    expect(mergeTxns([a, b]).length).toBe(2);
  });

  it('matches truncated narrations from a different export of the same account', () => {
    const csv = [t('2024-03-01', 'UPI-NETFLIX-NETFLIX@ICICI-ICIC0000001-412345678901-AUTOPAY', 19900, 'a.csv')];
    const pdf = [t('2024-03-01', 'UPI-NETFLIX-NETFLIX@ICICI-ICIC0000001', 19900, 'a.pdf')];
    expect(mergeTxns([csv, pdf]).length).toBe(1);
  });

  it('does not merge debits with credits of the same amount', () => {
    const a = [t('2024-03-01', 'X', 100, 'a', 'debit'), t('2024-03-01', 'X', 100, 'a', 'credit')];
    expect(mergeTxns([a]).length).toBe(2);
  });
});

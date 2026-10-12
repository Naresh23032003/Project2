import { describe, expect, it } from 'vitest';
import { detect } from '../../src/engine/detect';
import { addMonths } from '../../src/engine/dates';
import type { Txn } from '../../src/engine/types';

let n = 0;
const tx = (date: string, desc: string, rupees: number, direction: Txn['direction'] = 'debit'): Txn => ({
  id: `t${n++}`,
  date,
  desc,
  amount: Math.round(rupees * 100),
  direction,
  source: 't.csv',
});
const monthly = (start: string, count: number, desc: string, rupees: number | number[]): Txn[] =>
  Array.from({ length: count }, (_, i) => tx(addMonths(start, i), desc, Array.isArray(rupees) ? (rupees[i] as number) : rupees));
const every = (start: string, step: number, count: number, desc: string, rupees: number): Txn[] =>
  Array.from({ length: count }, (_, i) => {
    const d = new Date(Date.UTC(+start.slice(0, 4), +start.slice(5, 7) - 1, +start.slice(8, 10) + i * step));
    return tx(d.toISOString().slice(0, 10), desc, rupees);
  });

const NETFLIX_ACH = 'ACH D- NETFLIX ENTERTAINMENT SERVICES INDIA LLP-412345';
const GYM_UPI = 'UPI-GYM CLUB-GYMCLUB@ICICI-ICIC0000001-412345678901-UPI';
const ACME_UPI = 'UPI/P2M/412345678901/ACME STREAMING/Pay to/Federal Bank';
const ACME_MANDATE = 'UPI/P2M/412345678901/ACME STREAMING/UPI Mandate/HDFC BANK';

describe('detect: cadence', () => {
  it('finds a monthly mandate subscription from a known merchant', () => {
    const r = detect(monthly('2024-01-05', 6, NETFLIX_ACH, 199));
    expect(r).toHaveLength(1);
    const x = r[0]!;
    expect(x.display).toBe('Netflix');
    expect(x.cadence).toBe('monthly');
    expect(x.confidence).toBe('sure');
    expect(x.typicalAmount).toBe(19900);
    expect(x.yearlyCost).toBe(238800);
    expect(x.lastDate).toBe('2024-06-05');
    expect(x.nextExpected).toBe('2024-07-05');
    expect(x.status).toBe('active');
    expect(x.category).toBe('subscription');
    expect(x.reasons.join(' ')).toMatch(/5th/);
    expect(x.reasons.join(' ')).toMatch(/6 months/);
  });

  it('follows month-end dates', () => {
    const dates = ['2024-01-31', '2024-02-29', '2024-03-31', '2024-04-30', '2024-05-31'];
    const r = detect(dates.map((d) => tx(d, GYM_UPI, 1500)));
    expect(r).toHaveLength(1);
    expect(r[0]!.cadence).toBe('monthly');
    expect(r[0]!.hits).toHaveLength(5);
    expect(r[0]!.nextExpected).toBe('2024-06-30');
  });

  it('tolerates a few days of drift', () => {
    const dates = ['2024-01-05', '2024-02-07', '2024-03-04', '2024-04-06', '2024-05-05'];
    const r = detect(dates.map((d) => tx(d, GYM_UPI, 1500)));
    expect(r[0]?.cadence).toBe('monthly');
  });

  it('survives one missed month and says so', () => {
    const dates = ['2024-01-05', '2024-02-05', '2024-04-05', '2024-05-05', '2024-06-05'];
    const r = detect(dates.map((d) => tx(d, GYM_UPI, 1500)));
    expect(r).toHaveLength(1);
    expect(r[0]!.hits).toHaveLength(5);
    expect(r[0]!.missed).toBe(1);
    expect(r[0]!.reasons.join(' ')).toMatch(/missed/i);
  });

  it('finds yearly charges with only two hits', () => {
    const desc = 'UPI/P2M/412345678901/ACME ANNUAL CLUB/Pay to/Federal Bank';
    const r = detect([tx('2023-03-10', desc, 1499), tx('2024-03-10', desc, 1499)]);
    expect(r).toHaveLength(1);
    expect(r[0]!.cadence).toBe('yearly');
    expect(r[0]!.yearlyCost).toBe(149900);
    expect(r[0]!.nextExpected).toBe('2025-03-10');
  });

  it('finds weekly charges', () => {
    const r = detect(every('2024-01-02', 7, 8, 'UPI-DAILY MILK DAIRY-DAIRY@OKAXIS-UTIB0000001-412345678901-UPI', 140));
    expect(r).toHaveLength(1);
    expect(r[0]!.cadence).toBe('weekly');
    expect(r[0]!.yearlyCost).toBe(140 * 52 * 100);
  });

  it('finds quarterly charges', () => {
    const r = detect(Array.from({ length: 4 }, (_, i) => tx(addMonths('2023-02-10', i * 3), ACME_UPI, 899)));
    expect(r[0]?.cadence).toBe('quarterly');
    expect(r[0]?.yearlyCost).toBe(89900 * 4);
  });

  it('is not fooled by input order', () => {
    const txns = monthly('2024-01-05', 6, NETFLIX_ACH, 199);
    expect(detect([...txns].reverse())).toEqual(detect(txns));
  });

  it('merges slightly different spellings of an unknown merchant', () => {
    const a = ['2024-01-05', '2024-03-05', '2024-05-05'].map((d) => tx(d, 'UPI/P2M/412345678901/ACME STREAMING/Pay to/Federal Bank', 299));
    const b = ['2024-02-05', '2024-04-05', '2024-06-05'].map((d) => tx(d, 'UPI/P2M/412345678902/ACME STREAMNG/Pay to/Federal Bank', 299));
    const r = detect([...a, ...b]);
    expect(r).toHaveLength(1);
    expect(r[0]!.hits).toHaveLength(6);
  });
});

describe('detect: amounts', () => {
  it('treats a price change as one subscription and reports it', () => {
    const r = detect(monthly('2024-01-05', 6, 'MANDATE DEBIT SPOTIFY 412345', [119, 119, 119, 139, 139, 139]));
    expect(r).toHaveLength(1);
    expect(r[0]!.priceChanges).toEqual([{ date: '2024-04-05', from: 11900, to: 13900 }]);
    expect(r[0]!.typicalAmount).toBe(13900);
  });

  it('keeps two app store subscriptions with different amounts apart', () => {
    const gp = 'UPI-GOOGLE PLAY-GOOGLEPLAY@AXISBANK-UTIB0000002-412345678902-UPI';
    const r = detect([...monthly('2024-01-05', 5, gp, 129), ...monthly('2024-01-12', 5, gp, 199)]);
    expect(r).toHaveLength(2);
    expect(r.map((x) => x.typicalAmount).sort()).toEqual([12900, 19900]);
    expect(r.every((x) => x.cadence === 'monthly')).toBe(true);
  });

  it('ignores spending whose amounts and dates keep changing', () => {
    const amazon = 'UPI/P2M/412345678901/AMAZON/Pay to/Federal Bank';
    const r = detect([
      tx('2024-01-03', amazon, 450), tx('2024-02-20', amazon, 1299), tx('2024-03-08', amazon, 87),
      tx('2024-04-30', amazon, 2200), tx('2024-05-14', amazon, 640),
    ]);
    expect(r).toEqual([]);
  });

  it('ignores bills that vary every month', () => {
    const r = detect(monthly('2024-01-05', 8, 'ACH D- TORRENT POWER LTD-998877', 0).map((t, i) => ({ ...t, amount: [112000, 98000, 143000, 205000, 77000, 190000, 61000, 134000][i] as number })));
    expect(r.filter((x) => x.confidence !== 'maybe')).toEqual([]);
  });
});

describe('detect: status and noise', () => {
  it('marks a subscription that stopped as stopped', () => {
    const r = detect([...monthly('2024-01-05', 4, NETFLIX_ACH, 199), tx('2024-10-01', 'SOMETHING ELSE', 50)]);
    expect(r[0]!.status).toBe('stopped');
  });

  it('respects an explicit statement end date', () => {
    const txns = monthly('2024-01-05', 4, NETFLIX_ACH, 199);
    expect(detect(txns, { asOf: '2024-04-20' })[0]!.status).toBe('active');
    expect(detect(txns, { asOf: '2024-09-01' })[0]!.status).toBe('stopped');
  });

  it('ignores salary and other credits', () => {
    const r = detect(monthly('2024-01-01', 6, 'NEFT CR-SALARY TECHCORP', 50000).map((t) => ({ ...t, direction: 'credit' as const })));
    expect(r).toEqual([]);
  });

  it('cancels a debit that is reversed by a matching credit', () => {
    const debits = monthly('2024-01-05', 6, 'UPI-NETFLIX-NETFLIX@ICICI-ICIC0000001-412345678901-UPI', 199);
    const credits = debits.map((t) => ({ ...t, id: t.id + 'c', date: addMonths(t.date, 0).replace(/-05$/, '-07'), direction: 'credit' as const }));
    expect(detect([...debits, ...credits])).toEqual([]);
  });
});

describe('detect: confidence', () => {
  it('never says Sure for an unknown merchant without a mandate', () => {
    const r = detect(monthly('2024-01-05', 9, ACME_UPI, 299));
    expect(r).toHaveLength(1);
    expect(r[0]!.confidence).toBe('likely');
  });

  it('says Sure for an unknown merchant on a mandate with enough hits', () => {
    const r = detect(monthly('2024-01-05', 6, ACME_MANDATE, 299));
    expect(r[0]!.confidence).toBe('sure');
  });

  it('does not call a stable app store charge Sure without a mandate', () => {
    const r = detect(monthly('2024-01-05', 6, 'UPI-GOOGLE PLAY-GOOGLEPLAY@AXISBANK-UTIB0000002-412345678902-UPI', 129));
    expect(r).toHaveLength(1);
    expect(r[0]!.score).toBeGreaterThanOrEqual(80);
    expect(r[0]!.confidence).toBe('likely');
  });

  it('caps frequent variable-spend merchants below Sure', () => {
    const r = detect(every('2024-01-02', 7, 10, 'UPI-SWIGGY-SWIGGY@ICICI-ICIC0000001-412345678901-UPI', 199));
    expect(r.every((x) => x.confidence !== 'sure')).toBe(true);
  });

  it('needs three hits for an unknown monthly merchant but only two with a mandate', () => {
    expect(detect(monthly('2024-01-05', 2, ACME_UPI, 299))).toEqual([]);
    const withMandate = detect(monthly('2024-01-05', 2, ACME_MANDATE, 299));
    expect(withMandate).toHaveLength(1);
    expect(withMandate[0]!.confidence).toBe('likely');
  });

  it('offers a single charge from a known yearly service as Maybe', () => {
    const r = detect([tx('2024-05-20', 'POS XXXXXXXXXXXX5678 AMAZON PRIME MEMBERSHIP', 1499)]);
    expect(r).toHaveLength(1);
    expect(r[0]!.confidence).toBe('maybe');
    expect(r[0]!.cadence).toBe('yearly');
    expect(r[0]!.nextExpected).toBe('2025-05-20');
  });
});

describe('detect: separation', () => {
  const cat = (desc: string, rupees: number) => detect(monthly('2024-01-05', 5, desc, rupees))[0]?.category;
  it('puts EMIs in their own category', () => expect(cat('ACH D- BAJAJ FINANCE LTD-0012345', 8000)).toBe('emi'));
  it('puts mutual fund SIPs in their own category', () => expect(cat('NACH DR ICICI PRUDENTIAL MUTUAL FUND 123456', 5000)).toBe('sip'));
  it('puts insurance premiums in their own category', () => expect(cat('ECS-LIC OF INDIA-POLICY 123456', 2400)).toBe('insurance'));
  it('puts rent in its own category', () =>
    expect(cat('UPI-RAMESH K-RAMESH@OKAXIS-UTIB0000001-412345678908-RENT FOR MARCH', 15000)).toBe('rent'));
  it('puts card bill payments in their own category', () => expect(cat('CC PAYMENT HDFC BANK CARD 4012XXXXXXXX1234', 5000)).toBe('card_bill'));
  it('puts own account transfers in their own category', () => expect(cat('UPI-SELF-SELF@OKAXIS-UTIB0000001-412345678909-TRANSFER TO OWN ACCOUNT', 10000)).toBe('own_transfer'));
  it('puts regular payments to a person in transfers', () => expect(cat('UPI/P2A/233368991817/NOUSHAD B/Kotak', 3000)).toBe('transfer'));
  it('keeps real subscriptions as subscriptions', () => expect(cat('YOUTUBE PREMIUM GOOGLE *YOUTUBE PREMIUM', 129)).toBe('subscription'));
});

describe('detect: forgotten flag', () => {
  it('flags small monthly charges', () => {
    expect(detect(monthly('2024-01-05', 5, NETFLIX_ACH, 99))[0]!.forgotten).toBe(true);
  });
  it('does not flag large ones', () => {
    expect(detect(monthly('2024-01-05', 5, NETFLIX_ACH, 649))[0]!.forgotten).toBe(false);
  });
});

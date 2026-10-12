import Papa from 'papaparse';
import { addMonths } from './dates';

export const SAMPLE_FILE_NAME = 'sample-statement.csv';

type Row = { date: string; desc: string; amount: number; credit?: boolean };

function rng(seed: number) {
  return () => {
    seed = (seed + 0x6d2b79f5) | 0;
    let t = Math.imul(seed ^ (seed >>> 15), 1 | seed);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

const MONTH = ['JAN', 'FEB', 'MAR', 'APR', 'MAY', 'JUN', 'JUL', 'AUG'];
const pad = (n: number) => String(n).padStart(2, '0');
const dmy = (d: string) => `${d.slice(8, 10)}/${d.slice(5, 7)}/${d.slice(2, 4)}`;
const inr = (n: number) => {
  const [w = '0', f = '00'] = n.toFixed(2).split('.');
  const rest = w.slice(0, -3).replace(/\B(?=(\d{2})+(?!\d))/g, ',');
  return `${rest ? rest + ',' : ''}${w.slice(-3)}.${f}`;
};

// A made-up statement: eight months of a fictional account, so the first run shows every feature.
export function sampleStatementCsv(): string {
  const rand = rng(2024);
  const num = (lo: number, hi: number) => Math.round(lo + rand() * (hi - lo));
  const ref = () => '4' + String(num(10000000000, 99999999999));
  const rows: Row[] = [];
  const add = (date: string, desc: string, amount: number, credit = false) => rows.push({ date, desc, amount, credit });

  const monthly = (count: number, day: number, desc: (i: number) => string, amount: (i: number) => number, credit = false, first = 0) => {
    for (let i = first; i < first + count; i++) {
      const base = addMonths('2024-01-01', i);
      const slip = rand() < 0.2 ? [-1, 1, 2][num(0, 2)] ?? 0 : 0;
      add(`${base.slice(0, 8)}${pad(Math.max(1, Math.min(28, day + slip)))}`, desc(i), amount(i), credit);
    }
  };
  const scatter = (count: number, desc: () => string, lo: number, hi: number) => {
    for (let i = 0; i < count; i++) {
      const month = num(0, 7);
      add(`2024-${pad(month + 1)}-${pad(num(1, 28))}`, desc(), num(lo, hi));
    }
  };
  const upi = (payee: string, vpa: string, note = 'UPI') => `UPI-${payee}-${vpa}-HDFC0000001-${ref()}-${note}`;

  monthly(8, 1, () => `NEFT CR-HDFC0000001-NORTHWIND SOLUTIONS PVT LTD-ASHA RAO-${ref()}`, () => 85000, true);
  monthly(8, 3, (i) => upi('RAMESH KUMAR', 'RAMESH.K@OKAXIS', `RENT FOR ${MONTH[i]}`), () => 22000);
  monthly(8, 5, () => `ACH D- NETFLIX ENTERTAINMENT SERVICES INDIA LLP-${ref()}`, () => 649);
  monthly(8, 7, () => `ACH D- HDFC LTD-${ref()}`, () => 18500);
  monthly(8, 10, () => `ACH D- ICICI PRUDENTIAL MUTUAL FUND-${ref()}`, () => 10000);
  monthly(8, 12, () => upi('SPOTIFY INDIA', 'SPOTIFYUPI.PAYU@HDFCBANK', 'UPI MANDATE'), (i) => (i < 3 ? 119 : 139));
  monthly(8, 15, () => `ACH D- TORRENT POWER LTD-${ref()}`, () => num(900, 2400));
  monthly(8, 20, () => upi('GOOGLE PLAY', 'GOOGLEPLAY@AXISBANK', 'AUTOPAY'), () => 129);
  monthly(8, 28, () => upi('APPLE MEDIA SERVICES', 'APPLEMEDIA@HDFCBANK', 'UPI MANDATE'), () => 75);
  monthly(8, 8, () => 'SI-CULT FIT-5123XXXXXXXX9876', () => 2500);
  monthly(4, 9, () => `POS 4012XXXXXXXX1234 DROPBOX DUBLIN IE`, () => 899);
  add('2024-03-14', 'POS 4012XXXXXXXX1234 AMAZON PRIME MEMBERSHIP MUMBAI', 1499);
  monthly(8, 18, () => 'CC PAYMENT HDFC BANK CARD 4012XXXXXXXX1234', () => num(6000, 21000));
  scatter(14, () => upi('SWIGGY', 'SWIGGY@ICICI'), 180, 950);
  scatter(6, () => upi('ZOMATO', 'ZOMATO@HDFCBANK'), 220, 800);
  scatter(9, () => upi('UBER INDIA', 'UBER@AXISBANK'), 120, 640);
  scatter(7, () => 'POS 4012XXXXXXXX1234 AMAZON SELLER SERVICES BANGALORE', 300, 4200);
  scatter(8, () => upi('BIGBASKET', 'BIGBASKET@ICICI'), 400, 2600);
  scatter(4, () => `ATM WDL ${ref()} MUMBAI`, 2000, 10000);
  const friends = ['ARJUN MEHTA', 'PRIYA NAIR', 'KARAN SINGH', 'DIVYA IYER', 'ROHIT VERMA'];
  scatter(12, () => { const n = friends[num(0, friends.length - 1)] as string; return upi(n, n.replace(' ', '.') + '@OKAXIS', 'PAYMENT FROM PHONE'); }, 100, 3000);

  rows.sort((a, b) => (a.date < b.date ? -1 : a.date > b.date ? 1 : 0));
  let balance = 40000;
  const body = rows.map((r) => {
    balance += r.credit ? r.amount : -r.amount;
    return [dmy(r.date), r.desc, '0000' + r.desc.length, dmy(r.date), r.credit ? '' : inr(r.amount), r.credit ? inr(r.amount) : '', inr(balance)];
  });
  const grid = [
    ['Mr TEST PERSON (made-up sample data)', '', '', '', '', '', ''],
    ['Account Branch : ANDHERI WEST', '', '', '', '', '', ''],
    ['IFSC : HDFC0000123  MICR : 400240001', '', '', '', '', '', ''],
    ['Statement From : 01/01/24 To : 31/08/24', '', '', '', '', '', ''],
    [],
    ['Date', 'Narration', 'Chq./Ref.No.', 'Value Dt', 'Withdrawal Amt.', 'Deposit Amt.', 'Closing Balance'],
    ['********', '********', '********', '********', '********', '********', '********'],
    ...body,
    [],
    ['STATEMENT SUMMARY :-', '', '', '', '', '', ''],
  ];
  return Papa.unparse(grid, { newline: '\n' });
}

import { addMonths } from '../../src/engine/dates';
import type { Cadence, Category } from '../../src/engine/types';
import type { Format, Layout, Row } from './render';

export type Expect = {
  key: string;
  cadence: Cadence;
  category: Category;
  status?: 'active' | 'stopped';
  /** Typical amount in rupees. Needed when one merchant has two subscriptions. */
  amount?: number;
};
export type FileSpec = { name: string; layout: Layout; format: Format; from: string; to: string; only?: 'bank' | 'card' };
export type Persona = { name: string; rows: Row[]; files: FileSpec[]; expected: Expect[] };

function mulberry32(seed: number) {
  return () => {
    seed |= 0;
    seed = (seed + 0x6d2b79f5) | 0;
    let t = Math.imul(seed ^ (seed >>> 15), 1 | seed);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

const dim = (y: number, m: number) => new Date(Date.UTC(y, m, 0)).getUTCDate();
const pad = (n: number) => String(n).padStart(2, '0');

export class Gen {
  rows: Row[] = [];
  tag: Row['src'] = 'bank';
  private rand: () => number;
  constructor(seed: number) {
    this.rand = mulberry32(seed);
  }
  num(lo: number, hi: number) {
    return Math.round(lo + this.rand() * (hi - lo));
  }
  pick<T>(list: T[]): T {
    return list[Math.floor(this.rand() * list.length)] as T;
  }
  ref() {
    return '4' + String(this.num(10000000000, 99999999999));
  }
  add(date: string, desc: string, amount: number, dir: Row['dir'] = 'debit') {
    this.rows.push({ date, desc, amount, dir, src: this.tag });
  }
  /** Monthly series on a fixed day of the month, with an occasional one or two day slip. */
  monthly(startYm: string, count: number, day: number, desc: (i: number) => string, amount: number | ((i: number) => number), dir: Row['dir'] = 'debit') {
    for (let i = 0; i < count; i++) {
      const base = addMonths(`${startYm}-01`, i);
      const y = Number(base.slice(0, 4));
      const m = Number(base.slice(5, 7));
      let d = Math.min(day, dim(y, m));
      if (this.rand() < 0.2) d = Math.max(1, Math.min(dim(y, m), d + this.pick([-2, -1, 1, 2])));
      this.add(`${y}-${pad(m)}-${pad(d)}`, desc(i), typeof amount === 'function' ? amount(i) : amount, dir);
    }
  }
  /** Fixed-gap series, for things like 28 day recharge cycles. */
  everyDays(start: string, gap: number, count: number, desc: () => string, amount: number) {
    let t = Date.UTC(+start.slice(0, 4), +start.slice(5, 7) - 1, +start.slice(8, 10));
    for (let i = 0; i < count; i++) {
      this.add(new Date(t).toISOString().slice(0, 10), desc(), amount);
      t += gap * 86400000;
    }
  }
  /** Random one-off spending. */
  scatter(count: number, from: string, to: string, desc: () => string, lo: number, hi: number, dir: Row['dir'] = 'debit') {
    const a = Date.UTC(+from.slice(0, 4), +from.slice(5, 7) - 1, +from.slice(8, 10));
    const b = Date.UTC(+to.slice(0, 4), +to.slice(5, 7) - 1, +to.slice(8, 10));
    for (let i = 0; i < count; i++) {
      const t = a + Math.floor(this.rand() * ((b - a) / 86400000 + 1)) * 86400000;
      this.add(new Date(t).toISOString().slice(0, 10), desc(), this.num(lo, hi), dir);
    }
  }
}

const FRIENDS = ['ARJUN MEHTA', 'PRIYA NAIR', 'KARAN SINGH', 'DIVYA IYER', 'ROHIT VERMA', 'ANITA DESAI', 'SAMEER KHAN', 'NEHA GUPTA'];
const SHOPS = ['SHARMA KIRANA', 'FRESH BAKERS', 'CAFE COFFEE DAY', 'MEDPLUS PHARMACY', 'PUNJAB STORE', 'DOMINOS PIZZA', 'BARISTA'];

function hdfcUpi(g: Gen, payee: string, vpa: string, note = 'UPI') {
  return `UPI-${payee}-${vpa}-HDFC0000001-${g.ref()}-${note}`;
}

function persona1(offset: number): Persona {
  const g = new Gen(11 + offset);
  const mon = (i: number) => ['JAN', 'FEB', 'MAR', 'APR', 'MAY', 'JUN', 'JUL', 'AUG'][i];
  g.monthly('2024-01', 8, 1, () => `NEFT CR-HDFC0000001-TECHCORP SOLUTIONS PVT LTD-ASHA RAO-${g.ref()}`, 85000, 'credit');
  g.monthly('2024-01', 8, 3, (i) => hdfcUpi(g, 'RAMESH KUMAR', 'RAMESH.K@OKAXIS', `RENT FOR ${mon(i)}`), 22000);
  g.monthly('2024-01', 8, 5, () => `ACH D- NETFLIX ENTERTAINMENT SERVICES INDIA LLP-${g.ref()}`, 649);
  g.monthly('2024-01', 8, 7, () => `ACH D- HDFC LTD-${g.ref()}`, 18500);
  g.monthly('2024-01', 8, 10, () => `ACH D- ICICI PRUDENTIAL MUTUAL FUND-${g.ref()}`, 10000);
  g.monthly('2024-01', 8, 12, () => hdfcUpi(g, 'SPOTIFY INDIA', 'SPOTIFYUPI.PAYU@HDFCBANK', 'UPI MANDATE'), (i) => (i < 3 ? 119 : 139));
  g.monthly('2024-01', 8, 15, () => `ACH D- TORRENT POWER LTD-${g.ref()}`, () => g.num(900, 2400));
  g.monthly('2024-01', 8, 20, () => hdfcUpi(g, 'GOOGLE PLAY', 'GOOGLEPLAY@AXISBANK', 'AUTOPAY'), 129);
  g.monthly('2024-01', 8, 28, () => hdfcUpi(g, 'APPLE MEDIA SERVICES', 'APPLEMEDIA@HDFCBANK', 'UPI MANDATE'), 75);
  g.add('2024-03-14', 'POS 4012XXXXXXXX1234 AMAZON PRIME MEMBERSHIP MUMBAI', 1499);
  g.monthly('2024-01', 8, 18, () => 'CC PAYMENT HDFC BANK CARD 4012XXXXXXXX1234', () => g.num(6000, 21000));
  g.scatter(14, '2024-01-01', '2024-08-31', () => hdfcUpi(g, 'SWIGGY', 'SWIGGY@ICICI'), 180, 950);
  g.scatter(6, '2024-01-01', '2024-08-31', () => hdfcUpi(g, 'ZOMATO', 'ZOMATO@HDFCBANK'), 220, 800);
  g.scatter(9, '2024-01-01', '2024-08-31', () => hdfcUpi(g, 'UBER INDIA', 'UBER@AXISBANK'), 120, 640);
  g.scatter(7, '2024-01-01', '2024-08-31', () => `POS 4012XXXXXXXX1234 AMAZON SELLER SERVICES BANGALORE`, 300, 4200);
  g.scatter(8, '2024-01-01', '2024-08-31', () => hdfcUpi(g, 'BIGBASKET', 'BIGBASKET@ICICI'), 400, 2600);
  g.scatter(4, '2024-01-01', '2024-08-31', () => `ATM WDL ${g.ref()} MUMBAI`, 2000, 10000);
  g.scatter(12, '2024-01-01', '2024-08-31', () => { const n = g.pick(FRIENDS); return hdfcUpi(g, n, n.replace(' ', '.') + '@OKAXIS', 'PAYMENT FROM PHONE'); }, 100, 3000);
  g.scatter(10, '2024-01-01', '2024-08-31', () => { const s = g.pick(SHOPS); return hdfcUpi(g, s, s.replace(/ /g, '') + '@YBL'); }, 60, 900);
  return {
    name: 'HDFC salaried',
    rows: g.rows,
    files: [{ name: 'hdfc.csv', layout: 'hdfc', format: 'csv', from: '2024-01-01', to: '2024-08-31' }],
    expected: [
      { key: 'netflix', cadence: 'monthly', category: 'subscription' },
      { key: 'spotify', cadence: 'monthly', category: 'subscription' },
      { key: 'google-play', cadence: 'monthly', category: 'subscription' },
      { key: 'apple', cadence: 'monthly', category: 'subscription' },
      { key: 'amazon-prime', cadence: 'yearly', category: 'subscription' },
      { key: 'ramesh kumar', cadence: 'monthly', category: 'rent' },
      { key: 'hdfc', cadence: 'monthly', category: 'emi' },
      { key: 'icici prudential mutual fund', cadence: 'monthly', category: 'sip' },
      { key: 'torrent power', cadence: 'monthly', category: 'bill' },
    ],
  };
}

function persona2(offset: number): Persona {
  const g = new Gen(22 + offset);
  const sbi = (payee: string, vpa: string, note = 'UPI') => `TO TRANSFER-UPI/DR/${g.ref()}/${payee}/SBIN/${vpa}/${note}`;
  g.monthly('2024-03', 6, 8, () => sbi('SPOTIFY INDIA', 'spotifyupi.payu@sbi'), 59);
  g.everyDays('2024-03-02', 28, 7, () => sbi('JIO PREPAID', 'jio@sbi'), 299);
  g.add('2024-03-15', `DEBIT-ACH D- DISNEY STAR HOTSTAR-${g.ref()}`, 499);
  g.add('2024-06-15', `DEBIT-ACH D- DISNEY STAR HOTSTAR-${g.ref()}`, 499);
  g.monthly('2024-03', 6, 1, () => sbi('SUNITA PG', '9876500011@sbi', 'RENT'), 7000);
  g.scatter(6, '2024-03-01', '2024-08-31', () => `BY TRANSFER-UPI/CR/${g.ref()}/RAJESH KUMAR/SBIN/rajesh@sbi/UPI`, 2000, 8000, 'credit');
  g.scatter(40, '2024-03-01', '2024-08-31', () => sbi('CAMPUS CANTEEN', 'canteen@sbi'), 30, 140);
  g.scatter(10, '2024-03-01', '2024-08-31', () => sbi('ZOMATO', 'zomato@sbi'), 150, 520);
  g.scatter(4, '2024-03-01', '2024-08-31', () => sbi('AMAZON PAY', 'amazonpay@sbi'), 200, 1800);
  g.scatter(15, '2024-03-01', '2024-08-31', () => { const n = g.pick(FRIENDS); return sbi(n, n.replace(' ', '') + '@sbi'); }, 50, 700);
  return {
    name: 'SBI student',
    rows: g.rows,
    files: [{ name: 'sbi.xls', layout: 'sbi', format: 'xls', from: '2024-03-01', to: '2024-08-31' }],
    expected: [
      { key: 'spotify', cadence: 'monthly', category: 'subscription' },
      { key: 'jio', cadence: 'monthly', category: 'subscription' },
      { key: 'hotstar', cadence: 'quarterly', category: 'subscription' },
      { key: 'sunita pg', cadence: 'monthly', category: 'rent' },
    ],
  };
}

function persona3(offset: number): Persona {
  const g = new Gen(33 + offset);
  const icici = (vpa: string, note = 'Payment from PhonePe', bank = 'ICICI Bank') => `UPI/${g.ref()}/${note}/${vpa}/${bank}`;
  g.scatter(14, '2024-01-01', '2024-12-31', () => `NEFT CR-ICIC0000001-CLIENT ${g.pick(['ALPHA', 'BETA', 'GAMMA'])} PRIVATE LIMITED-${g.ref()}`, 20000, 90000, 'credit');
  g.monthly('2024-01', 12, 3, () => `ACH D- ADOBE SYSTEMS INDIA PVT LTD-${g.ref()}`, 1675);
  g.monthly('2024-01', 12, 9, () => icici('canva@icici', 'Mandate Payment'), 499);
  g.monthly('2024-01', 12, 14, () => 'POS XXXXXXXXXXXX9876 OPENAI *CHATGPT SUBSCR SAN FRANCISCO US', () => g.num(1630, 1690));
  g.add('2024-08-22', 'POS XXXXXXXXXXXX9876 MICROSOFT*MICROSOFT 365 MSBILL.INFO', 4899);
  g.monthly('2024-01', 6, 4, () => 'POS XXXXXXXXXXXX9876 DROPBOX DUBLIN IE', 899);
  g.monthly('2024-01', 12, 15, () => icici('googleplay@axisbank', 'Payment from PhonePe', 'Axis Bank'), 129);
  g.monthly('2024-01', 12, 22, () => icici('googleplay@axisbank', 'Payment from PhonePe', 'Axis Bank'), 49);
  for (const ym of ['2024-01', '2024-04', '2024-07', '2024-10']) g.monthly(ym, 1, 20, () => `ECS-LIC OF INDIA-POLICY ${g.num(100000, 999999)}`, 3200);
  g.monthly('2024-01', 12, 5, () => `ACH D- AXIS MUTUAL FUND-${g.ref()}`, 5000);
  g.monthly('2024-01', 12, 1, () => icici('9876512345@ybl', 'Coworking rent', 'State Bank Of India'), 6500);
  g.monthly('2024-01', 12, 12, () => `ACH D- BESCOM-${g.ref()}`, () => g.num(700, 1900));
  g.scatter(22, '2024-01-01', '2024-12-31', () => icici('uber@axisbank', 'NA', 'Axis Bank'), 90, 780);
  g.scatter(6, '2024-01-01', '2024-12-31', () => 'POS XXXXXXXXXXXX9876 AMAZON SELLER SERVICES BANGALORE', 250, 6000);
  g.scatter(3, '2024-01-01', '2024-12-31', () => 'POS XXXXXXXXXXXX9876 FLIPKART INTERNET BANGALORE', 500, 7000);
  g.scatter(5, '2024-01-01', '2024-12-31', () => 'POS XXXXXXXXXXXX9876 IRCTC WEB PAYMENT NEW DELHI', 400, 3500);
  g.scatter(20, '2024-01-01', '2024-12-31', () => { const n = g.pick(FRIENDS); return icici(n.replace(' ', '').toLowerCase() + '@oksbi', 'NA', 'State Bank Of India'); }, 100, 4000);
  g.scatter(16, '2024-01-01', '2024-12-31', () => { const s = g.pick(SHOPS); return icici(s.replace(/ /g, '').toLowerCase() + '@ybl', 'NA', 'Yes Bank'); }, 80, 1500);
  return {
    name: 'ICICI freelancer',
    rows: g.rows,
    files: [{ name: 'icici.xlsx', layout: 'icici', format: 'xlsx', from: '2024-01-01', to: '2024-12-31' }],
    expected: [
      { key: 'adobe', cadence: 'monthly', category: 'subscription' },
      { key: 'canva', cadence: 'monthly', category: 'subscription' },
      { key: 'chatgpt', cadence: 'monthly', category: 'subscription' },
      { key: 'microsoft-365', cadence: 'yearly', category: 'subscription' },
      { key: 'dropbox', cadence: 'monthly', category: 'subscription', status: 'stopped' },
      { key: 'google-play', cadence: 'monthly', category: 'subscription', amount: 129 },
      { key: 'google-play', cadence: 'monthly', category: 'subscription', amount: 49 },
      { key: 'lic policy', cadence: 'quarterly', category: 'insurance' },
      { key: 'axis mutual fund', cadence: 'monthly', category: 'sip' },
      { key: 'phone 9876512345', cadence: 'monthly', category: 'rent' },
      { key: 'bescom', cadence: 'monthly', category: 'bill' },
    ],
  };
}

function persona4(offset: number): Persona {
  const g = new Gen(44 + offset);
  const axis = (payee: string, note = 'Pay to', bank = 'Axis Bank') => `UPI/P2M/${g.ref()}/${payee}/${note}/${bank}`;
  g.monthly('2023-11', 14, 1, () => `NEFT CR-UTIB0000001-GLOBAL SYSTEMS LTD-${g.ref()}`, 140000, 'credit');
  g.monthly('2023-11', 14, 5, () => `ACH D- LIC HOUSING FINANCE LTD-${g.ref()}`, 30000);
  g.monthly('2023-11', 14, 6, () => `ACH D- TATA PLAY LTD-${g.ref()}`, 550);
  g.monthly('2023-11', 14, 10, () => axis('AIRTEL POSTPAID', 'UPI Mandate'), 649);
  g.monthly('2023-11', 14, 2, () => `UPI/P2A/${g.ref()}/KAVITA DEVI/Kotak`, 3500);
  g.add('2023-12-20', `ECS-HDFC LIFE INSURANCE-${g.ref()}`, 24000);
  g.add('2024-12-20', `ECS-HDFC LIFE INSURANCE-${g.ref()}`, 24000);
  g.monthly('2023-11', 14, 22, () => 'CC PAYMENT AXIS BANK CARD 5123XXXXXXXX9876', () => g.num(9000, 38000));
  g.scatter(24, '2023-11-01', '2024-12-31', () => axis('RELIANCE FRESH'), 300, 3800);
  g.scatter(10, '2023-11-01', '2024-12-31', () => axis('INDIAN OIL FUEL STATION'), 800, 3500);
  g.scatter(14, '2023-11-01', '2024-12-31', () => axis(g.pick(SHOPS)), 80, 1800);
  g.scatter(6, '2023-11-01', '2024-12-31', () => `ATM WDL ${g.ref()} PUNE`, 2000, 8000);
  g.tag = 'card';
  g.monthly('2023-11', 14, 11, () => 'NETFLIX.COM 866-579-7172 CA', 649);
  g.monthly('2023-11', 14, 17, () => 'SPOTIFY P1A2B3C4 STOCKHOLM SE', 139);
  g.monthly('2023-11', 14, 25, () => 'SWIGGY ONE BANGALORE', 299);
  g.add('2023-11-21', 'AMAZON PRIME MEMBERSHIP MUMBAI IN', 1499);
  g.add('2024-11-21', 'AMAZON PRIME MEMBERSHIP MUMBAI IN', 1499);
  g.scatter(30, '2023-11-01', '2024-12-31', () => 'AMAZON SELLER SERVICES BANGALORE IN', 200, 5200);
  g.scatter(12, '2023-11-01', '2024-12-31', () => 'BIGBASKET BANGALORE IN', 500, 3200);
  g.scatter(9, '2023-11-01', '2024-12-31', () => g.pick(['TAJ RESTAURANT MUMBAI', 'BARBEQUE NATION PUNE', 'PVR CINEMAS PUNE', 'DECATHLON SPORTS PUNE']), 400, 4800);
  return {
    name: 'Axis family, two bank files plus a card',
    rows: g.rows,
    // The two bank files overlap from June to August.
    files: [
      { name: 'axis-a.csv', layout: 'axis', format: 'csv', from: '2023-11-01', to: '2024-08-31', only: 'bank' },
      { name: 'axis-b.csv', layout: 'axis', format: 'csv', from: '2024-06-01', to: '2024-12-31', only: 'bank' },
      { name: 'card.csv', layout: 'card', format: 'csv', from: '2023-11-01', to: '2024-12-31', only: 'card' },
    ],
    expected: [
      { key: 'tata-play', cadence: 'monthly', category: 'subscription' },
      { key: 'airtel', cadence: 'monthly', category: 'subscription' },
      { key: 'lic housing finance', cadence: 'monthly', category: 'emi' },
      { key: 'hdfc life insurance', cadence: 'yearly', category: 'insurance' },
      { key: 'kavita devi', cadence: 'monthly', category: 'transfer' },
      { key: 'netflix', cadence: 'monthly', category: 'subscription' },
      { key: 'spotify', cadence: 'monthly', category: 'subscription' },
      { key: 'swiggy-one', cadence: 'monthly', category: 'subscription' },
      { key: 'amazon-prime', cadence: 'yearly', category: 'subscription' },
    ],
  };
}

function persona5(offset: number): Persona {
  const g = new Gen(55 + offset);
  const kotak = (payee: string, note = 'Pay to') => `UPI/P2M/${g.ref()}/${payee}/${note}/Kotak Mahindra Bank`;
  g.monthly('2024-01', 12, 1, () => `NEFT CR-KKBK0000001-MEDIA HOUSE LTD-${g.ref()}`, 95000, 'credit');
  g.monthly('2024-01', 12, 4, () => `ACH D- TATA CAPITAL FINANCIAL SERVICES LTD-${g.ref()}`, 14200);
  g.monthly('2024-04', 9, 12, () => `ACH D- BAJAJ FINSERV EMI-${g.ref()}`, 3333);
  g.monthly('2024-01', 12, 7, () => `ACH D- INDIAN CLEARING CORP-${g.ref()}`, 3000);
  g.monthly('2024-01', 12, 21, () => `ACH D- INDIAN CLEARING CORP-${g.ref()}`, 2000);
  g.monthly('2024-01', 12, 1, () => `IMPS-${g.ref()}-LANDLORD ASHA-HDFC-XXXXXXXX1234-RENT`, 18000);
  g.monthly('2024-01', 12, 3, () => `IMPS-${g.ref()}-SAVITA DEVI-HDFC-XXXXXXXX1234-HELP`, 3000);
  g.monthly('2024-01', 12, 18, () => `ECS-STAR HEALTH INSURANCE-${g.ref()}`, 1350);
  g.monthly('2024-01', 4, 6, () => kotak('ZEE5', 'UPI Mandate'), 99);
  g.monthly('2024-01', 12, 8, () => `SI-CULT FIT-5123XXXXXXXX9876`, 2500);
  g.monthly('2024-01', 12, 14, () => `ACH D- BESCOM-${g.ref()}`, () => g.num(600, 1700));
  g.everyDays('2024-01-01', 7, 52, () => kotak('NANDINI MILK PARLOUR'), 420);
  g.scatter(30, '2024-01-01', '2024-12-31', () => kotak('SWIGGY'), 150, 900);
  g.scatter(10, '2024-01-01', '2024-12-31', () => kotak('ZOMATO'), 200, 800);
  g.scatter(8, '2024-01-01', '2024-12-31', () => kotak('AMAZON'), 300, 7000);
  g.scatter(16, '2024-01-01', '2024-12-31', () => kotak(g.pick(SHOPS)), 70, 1700);
  g.scatter(14, '2024-01-01', '2024-12-31', () => { const n = g.pick(FRIENDS); return `UPI/P2A/${g.ref()}/${n}/HDFC`; }, 100, 4000);
  return {
    name: 'Kotak noisy mix',
    rows: g.rows,
    files: [{ name: 'kotak.xlsx', layout: 'kotak', format: 'xlsx', from: '2024-01-01', to: '2024-12-31' }],
    expected: [
      { key: 'tata capital financial', cadence: 'monthly', category: 'emi' },
      { key: 'bajaj finserv emi', cadence: 'monthly', category: 'emi' },
      { key: 'indian clearing corp', cadence: 'monthly', category: 'sip', amount: 3000 },
      { key: 'indian clearing corp', cadence: 'monthly', category: 'sip', amount: 2000 },
      { key: 'landlord asha', cadence: 'monthly', category: 'rent' },
      { key: 'savita devi', cadence: 'monthly', category: 'transfer' },
      { key: 'star health insurance', cadence: 'monthly', category: 'insurance' },
      { key: 'zee5', cadence: 'monthly', category: 'subscription', status: 'stopped' },
      { key: 'cult-fit', cadence: 'monthly', category: 'subscription' },
      { key: 'bescom', cadence: 'monthly', category: 'bill' },
      { key: 'nandini milk parlour', cadence: 'weekly', category: 'subscription' },
    ],
  };
}

export const personas = (seedOffset = 0): Persona[] => [persona1, persona2, persona3, persona4, persona5].map((f) => f(seedOffset));

import type { Merchant, Normalized, Rail } from './types';

const GATEWAY_PREFIX = /^(RAZ|RZP|PAYU|PYU|PAYTM|PPSL|BILLDESK|CCAVENUE|CCA|CASHFREE|PHONEPE|IPAY)\s*\*\s*/;
const GATEWAY_WORDS = new Set([
  'RAZORPAY', 'RAZORPAYX', 'RAZ', 'RZP', 'PAYU', 'PAYUMONEY', 'BILLDESK', 'BD', 'CCAVENUE', 'CASHFREE', 'PAYTM', 'PPSL', 'PHONEPE', 'IPAY', 'PAYMENT', 'GATEWAY',
]);
const CORPORATE_NOISE = new Set(['PVT', 'LTD', 'LIMITED', 'PRIVATE', 'INDIA', 'SERVICES', 'LLP', 'INC', 'TECHNOLOGIES', 'TECHNOLOGY']);
const RAIL_WORDS = new Set(['POS', 'DEBIT', 'ACH', 'NACH', 'ECS', 'SI', 'MANDATE', 'AUTOPAY', 'DR', 'UPI', 'NEFT', 'RTGS', 'IMPS']);
const DOMAIN_WORDS = new Set(['COM', 'INFO', 'NET', 'ORG']);
const TRAILING_TAIL = new Set([
  'IN', 'CO', 'US', 'CA', 'SE', 'IE', 'SG', 'GB', 'NL', 'LU', 'UK', 'AE', 'DE', 'FR',
  'MUMBAI', 'DELHI', 'BANGALORE', 'BENGALURU', 'CHENNAI', 'KOLKATA', 'HYDERABAD', 'PUNE', 'AHMEDABAD', 'GURGAON', 'GURUGRAM', 'NOIDA',
  'JAIPUR', 'SURAT', 'LUCKNOW', 'KOCHI', 'INDORE', 'CHANDIGARH', 'THANE', 'NAGPUR', 'BHOPAL', 'PATNA', 'FARIDABAD', 'GHAZIABAD', 'VADODARA',
  'COIMBATORE', 'VISAKHAPATNAM', 'MAHARASHTRA', 'KARNATAKA', 'TAMILNADU', 'TELANGANA', 'GUJARAT', 'STOCKHOLM', 'DUBLIN', 'SINGAPORE', 'LONDON',
  'AMSTERDAM', 'LUXEMBOURG', 'CALIFORNIA',
]);
const TAIL_PAIRS = new Set(['NEW DELHI', 'SAN FRANCISCO', 'MOUNTAIN VIEW', 'NAVI MUMBAI', 'TAMIL NADU']);
const BANK_FIELD = /^(STATE BANK( OF INDIA)?|(HDFC|ICICI|AXIS|SBI|SBIN|KOTAK( MAHINDRA)?|KKBK|YES|YESB|UTIB|ICIC|FEDERAL|IDFC( FIRST)?|PNB|BOB|CANARA|UNION|INDUSIND|RBL|AU|PAYTM|PYTM|APL)( BANK)?( LTD| LIMITED)?)$/;
const IFSC = /^[A-Z]{4}0[A-Z0-9]{6}$/;
const UPI_NOTE = /^(PAYMENT FROM .*|PAY TO.*|UPI.*|NA|N\/A|AUTOPAY.*|MANDATE.*|PAYMENT|SENT USING .*|COLLECT.*|NO REMARKS)$/;

function detectRail(s: string): Rail {
  if (/\bUPI\b/.test(s)) return 'upi';
  if (/\b(N?ACH|ECS)\b/.test(s)) return 'nach';
  if (/\b(NEFT|RTGS)\b/.test(s)) return 'neft';
  if (/\bIMPS\b/.test(s)) return 'imps';
  if (/\b(SI|MANDATE|AUTOPAY)\b/.test(s)) return 'si';
  if (/^POS\b/.test(s) || GATEWAY_PREFIX.test(s)) return 'card';
  return 'other';
}

function isRefToken(t: string): boolean {
  if (/X{4,}/.test(t)) return true;
  if (/^\d+$/.test(t)) return t.length >= 4;
  const digits = (t.match(/\d/g) ?? []).length;
  return digits >= 3 && t.length >= 5;
}

function cleanText(input: string): string[] {
  let s = input.toUpperCase();
  s = s.replace(/\b\d{3}-\d{3}-\d{4}\b/g, ' ');
  s = s.replace(/G\.CO\/HELPPAY#?/g, ' ');
  s = s.replace(/\bOF INDIA\b/g, ' ');
  s = s.replace(GATEWAY_PREFIX, '');
  s = s.replace(/\b(N?ACH)\s*D\s*-/g, '$1 ');
  s = s.replace(/E-MANDATE/g, 'MANDATE');
  s = s.replace(/[*\-/._#,]+/g, ' ');
  const tokens: string[] = [];
  for (const t of s.split(/\s+/)) {
    if (!t) continue;
    if (RAIL_WORDS.has(t) || CORPORATE_NOISE.has(t) || DOMAIN_WORDS.has(t)) continue;
    if (isRefToken(t)) continue;
    if (tokens[tokens.length - 1] === t) continue;
    tokens.push(t);
  }
  while (tokens.length > 1) {
    const pair = tokens.slice(-2).join(' ');
    if (tokens.length > 2 && TAIL_PAIRS.has(pair)) tokens.splice(-2, 2);
    else if (TRAILING_TAIL.has(tokens[tokens.length - 1] as string)) tokens.pop();
    else break;
  }
  return tokens;
}

function handleToTokens(vpa: string): string[] {
  const local = (vpa.split('@')[0] ?? '').toUpperCase();
  if (/^\d{10,}$/.test(local)) return ['PHONE', local];
  const parts = local.split(/[._-]+/).filter((p) => p && !GATEWAY_WORDS.has(p) && !/^\d+$/.test(p));
  return parts.map((p) => (p.length > 6 && p.endsWith('UPI') ? p.slice(0, -3) : p));
}

function splitFields(s: string, slash: boolean): string[] {
  return s.split(slash ? '/' : '-').map((f) => f.trim()).filter(Boolean);
}

function upiPayee(s: string): string[] {
  const slash = s.includes('/');
  const fields = splitFields(s, slash);
  const marked = /UPI\/(P2M|P2A|P2P|DR|CR)\//.test(s);
  const vpa = fields.find((f) => f.includes('@'));
  if (slash && !marked && vpa) return handleToTokens(vpa);

  const candidates = fields.filter((f) => {
    if (f.includes('@')) return false;
    if (RAIL_WORDS.has(f) || /^(P2M|P2A|P2P|CR)$/.test(f)) return false;
    if (/^\d+$/.test(f) || IFSC.test(f) || BANK_FIELD.test(f) || UPI_NOTE.test(f)) return false;
    return true;
  });
  for (const c of candidates) {
    const tokens = cleanText(c);
    if (tokens.length && !tokens.every((t) => GATEWAY_WORDS.has(t))) return tokens;
  }
  return vpa ? handleToTokens(vpa) : [];
}

function transferPayee(s: string): string[] {
  for (const f of splitFields(s, false)) {
    if (/^(NEFT|RTGS|IMPS)\b( DR| CR)?$/.test(f)) continue;
    if (/^\d+$/.test(f) || IFSC.test(f) || BANK_FIELD.test(f) || /X{4,}/.test(f)) continue;
    if (/^(NEFT|RTGS|IMPS)\d+$/.test(f)) continue;
    const tokens = cleanText(f);
    if (tokens.length) return tokens;
  }
  return [];
}

const ACRONYMS = new Set(['HDFC', 'ICICI', 'SBI', 'LIC', 'EMI', 'SIP', 'UPI', 'CC', 'PG', 'ATM', 'IRCTC', 'HPCL', 'BPCL', 'PVR', 'BSNL', 'NPS', 'PPF', 'MF', 'OTT', 'IDFC', 'PNB', 'RBL', 'TCS', 'LLP']);

function titleCase(tokens: string[]): string {
  return tokens.map((t) => (ACRONYMS.has(t) ? t : t.charAt(0) + t.slice(1).toLowerCase())).join(' ');
}

const compiled = new WeakMap<Merchant[], { merchant: Merchant; patterns: RegExp[] }[]>();

function compile(merchants: Merchant[]) {
  let list = compiled.get(merchants);
  if (!list) {
    list = merchants.map((merchant) => ({ merchant, patterns: merchant.patterns.map((p) => new RegExp(p)) }));
    compiled.set(merchants, list);
  }
  return list;
}

export function normalize(desc: string, merchants: Merchant[] = []): Normalized {
  const raw = desc.toUpperCase().replace(/\s+/g, ' ').trim();
  if (!raw) return { key: '', display: '', rail: 'other', mandate: false, person: false };
  const s = raw.replace(/^(TO|BY) TRANSFER[- ]/, '');

  const rail = detectRail(s);
  const mandate = /\b(N?ACH|ECS|SI|MANDATE|E-MANDATE|AUTOPAY)\b/.test(s);

  let tokens: string[];
  if (rail === 'upi') tokens = upiPayee(s);
  else if (rail === 'neft' || rail === 'imps') tokens = transferPayee(s);
  else tokens = cleanText(s);

  const person = rail === 'neft' || rail === 'imps' || /UPI\/P2A\//.test(s) || tokens[0] === 'PHONE';

  const text = tokens.join(' ');
  for (const { merchant, patterns } of compile(merchants)) {
    if (patterns.some((p) => p.test(text))) {
      return { key: merchant.id, display: merchant.name, rail, mandate, person: false, knownId: merchant.id };
    }
  }
  return { key: text.toLowerCase(), display: titleCase(tokens), rail, mandate, person };
}

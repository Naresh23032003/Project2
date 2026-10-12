export type DateOrder = 'dmy' | 'mdy';
export type ParsedAmount = { paise: number; negative: boolean; side: 'dr' | 'cr' | undefined };

const MONTHS = ['jan', 'feb', 'mar', 'apr', 'may', 'jun', 'jul', 'aug', 'sep', 'oct', 'nov', 'dec'];

function iso(y: number, m: number, d: number): string | null {
  if (m < 1 || m > 12 || d < 1 || y < 1900 || y > 2200) return null;
  const leap = (y % 4 === 0 && y % 100 !== 0) || y % 400 === 0;
  const dim = [31, leap ? 29 : 28, 31, 30, 31, 30, 31, 31, 30, 31, 30, 31][m - 1] as number;
  if (d > dim) return null;
  return `${y}-${String(m).padStart(2, '0')}-${String(d).padStart(2, '0')}`;
}

function fullYear(y: string): number {
  if (y.length === 4) return Number(y);
  const n = Number(y);
  return n <= 69 ? 2000 + n : 1900 + n;
}

function monthFromName(name: string): number | null {
  const i = MONTHS.indexOf(name.slice(0, 3).toLowerCase());
  return i === -1 ? null : i + 1;
}

function excelSerial(n: number): string | null {
  if (!Number.isFinite(n) || n < 20000 || n > 80000) return null;
  const d = new Date(Date.UTC(1899, 11, 30) + Math.floor(n) * 86400000);
  return iso(d.getUTCFullYear(), d.getUTCMonth() + 1, d.getUTCDate());
}

export function parseDate(input: string | number, order: DateOrder = 'dmy'): string | null {
  if (typeof input === 'number') return excelSerial(input);
  let s = input.trim();
  if (!s) return null;
  if (/^\d{5}$/.test(s)) return excelSerial(Number(s));
  s = s.replace(/[ T]\d{1,2}:\d{2}(:\d{2})?.*$/, '').trim();

  let m = /^(\d{4})[-/.](\d{1,2})[-/.](\d{1,2})$/.exec(s);
  if (m) return iso(Number(m[1]), Number(m[2]), Number(m[3]));

  m = /^(\d{1,2})[-/. ](\d{1,2})[-/. ](\d{2}|\d{4})$/.exec(s);
  if (m) {
    const [a, b] = [Number(m[1]), Number(m[2])];
    const y = fullYear(m[3] as string);
    return order === 'dmy' ? iso(y, b, a) : iso(y, a, b);
  }

  m = /^(\d{1,2})[-/. ]?([A-Za-z]{3,9})[-/. ,]*(\d{2}|\d{4})$/.exec(s);
  if (m) {
    const mon = monthFromName(m[2] as string);
    return mon ? iso(fullYear(m[3] as string), mon, Number(m[1])) : null;
  }

  m = /^([A-Za-z]{3,9})[ -]+(\d{1,2}),?[ -]+(\d{2}|\d{4})$/.exec(s);
  if (m) {
    const mon = monthFromName(m[1] as string);
    return mon ? iso(fullYear(m[3] as string), mon, Number(m[2])) : null;
  }
  return null;
}

export function inferDateOrder(samples: string[]): DateOrder {
  let dayFirst = false;
  let monthFirst = false;
  for (const raw of samples) {
    const m = /^\s*(\d{1,2})[-/. ](\d{1,2})[-/. ]\d{2,4}/.exec(raw);
    if (!m) continue;
    const [a, b] = [Number(m[1]), Number(m[2])];
    if (a > 12) dayFirst = true;
    if (b > 12 && a <= 12) monthFirst = true;
  }
  return monthFirst && !dayFirst ? 'mdy' : 'dmy';
}

export function parseAmount(input: string | number): ParsedAmount | null {
  let s: string;
  if (typeof input === 'number') {
    if (!Number.isFinite(input)) return null;
    s = String(input);
  } else {
    s = input.trim();
  }
  if (!s) return null;

  let negative = false;
  let side: 'dr' | 'cr' | undefined;

  const paren = /^\((.*)\)$/.exec(s);
  if (paren) {
    negative = true;
    s = paren[1] as string;
  }
  const drcr = /\s*(dr|cr)\.?\s*$/i.exec(s);
  if (drcr) {
    side = (drcr[1] as string).toLowerCase() as 'dr' | 'cr';
    s = s.slice(0, drcr.index);
  }
  s = s.replace(/^\s*(₹|rs\.?|inr|\$)\s*/i, '').trim();
  if (s.startsWith('-')) {
    negative = true;
    s = s.slice(1);
  } else if (s.endsWith('-')) {
    negative = true;
    s = s.slice(0, -1);
  }
  s = s.replace(/[,\s]/g, '');
  if (!/^(\d+\.?\d*|\.\d+)$/.test(s)) return null;

  const [whole = '0', frac = ''] = s.split('.');
  const digits = (frac + '00').slice(0, 2);
  let paise = Number(whole || '0') * 100 + Number(digits);
  if (Number(frac.charAt(2) || '0') >= 5) paise += 1;
  return { paise, negative, side };
}

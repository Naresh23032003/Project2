const MS_PER_DAY = 86400000;

function parts(d: string): [number, number, number] {
  const [y, m, day] = d.split('-').map(Number) as [number, number, number];
  return [y, m, day];
}

function utc(d: string): number {
  const [y, m, day] = parts(d);
  return Date.UTC(y, m - 1, day);
}

function format(ms: number): string {
  const d = new Date(ms);
  return `${d.getUTCFullYear()}-${String(d.getUTCMonth() + 1).padStart(2, '0')}-${String(d.getUTCDate()).padStart(2, '0')}`;
}

export function daysBetween(a: string, b: string): number {
  return Math.round((utc(b) - utc(a)) / MS_PER_DAY);
}

export function addDays(d: string, n: number): string {
  return format(utc(d) + n * MS_PER_DAY);
}

export function addMonths(d: string, n: number): string {
  const [y, m, day] = parts(d);
  const total = y * 12 + (m - 1) + n;
  const ny = Math.floor(total / 12);
  const nm = total % 12;
  const dim = new Date(Date.UTC(ny, nm + 1, 0)).getUTCDate();
  return format(Date.UTC(ny, nm, Math.min(day, dim)));
}

export function monthIndex(d: string): number {
  const [y, m] = parts(d);
  return y * 12 + (m - 1);
}

export function dayOfMonth(d: string): number {
  return parts(d)[2];
}

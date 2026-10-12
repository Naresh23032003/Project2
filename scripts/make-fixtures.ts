// Writes synthetic statement files into test/fixtures. Run: npx tsx scripts/make-fixtures.ts
// Everything is invented. Never put a real statement in this folder.
import { mkdirSync, writeFileSync } from 'node:fs';
import { personas } from '../test/golden/personas';
import { renderFile, type Format, type Layout, type Row } from '../test/golden/render';

const OUT = 'test/fixtures';
mkdirSync(OUT, { recursive: true });
const all = personas();
const manifest: Record<string, { count: number; bank?: string; layout: string }> = {};

function write(name: string, layout: Layout, format: Format, rows: Row[], bank?: string) {
  const f = renderFile(name, layout, format, rows);
  writeFileSync(`${OUT}/${name}`, f.csv !== undefined ? f.csv : Buffer.from(f.bytes as ArrayBuffer));
  manifest[name] = { count: rows.length, bank, layout };
}
const slice = (i: number, from: string, to: string, src: 'bank' | 'card' = 'bank') =>
  (all[i]?.rows ?? []).filter((r) => (r.src ?? 'bank') === src && r.date >= from && r.date <= to);

write('hdfc.csv', 'hdfc', 'csv', slice(0, '2024-01-01', '2024-03-31'), 'hdfc');
write('sbi.xls', 'sbi', 'xls', slice(1, '2024-03-01', '2024-05-31'), 'sbi');
write('icici.xlsx', 'icici', 'xlsx', slice(2, '2024-01-01', '2024-03-31'), 'icici');
write('axis.csv', 'axis', 'csv', slice(3, '2024-01-01', '2024-03-31'), 'axis');
write('kotak.xlsx', 'kotak', 'xlsx', slice(4, '2024-01-01', '2024-03-31'), 'kotak');
write('card.csv', 'card', 'csv', slice(3, '2024-01-01', '2024-03-31', 'card'));

// A layout nobody has seen before: the app should ask which column is which.
const odd = slice(0, '2024-01-01', '2024-02-29');
const oddCsv =
  'when,what,out,in\n' +
  odd.map((r) => `${r.date.slice(8, 10)}/${r.date.slice(5, 7)}/${r.date.slice(0, 4)},"${r.desc}",${r.dir === 'debit' ? r.amount : ''},${r.dir === 'credit' ? r.amount : ''}`).join('\n') +
  '\n';
writeFileSync(`${OUT}/unknown-format.csv`, oddCsv);
manifest['unknown-format.csv'] = { count: odd.length, layout: 'unknown' };

writeFileSync(`${OUT}/manifest.json`, JSON.stringify(manifest, null, 1));
console.log(Object.keys(manifest).length, 'fixtures written');

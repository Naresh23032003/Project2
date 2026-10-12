import { summarize, type Decision } from './summary';
import { formatRupees } from './format';
import { CADENCE_LABEL, TYPE_LABEL } from './labels';
import type { Recurring } from './types';

const CHOICE_LABEL: Record<Decision, string> = { keep: 'Keep', cancel: 'Cancel', not: 'Not a subscription' };
const HEADER = [
  'Service', 'Type', 'How often', 'Typical amount (INR)', 'Per year (INR)', 'First charged', 'Last charged', 'Next expected',
  'Confidence', 'Status', 'Your choice', 'Why we think so',
];

// A cell that starts with these is read as a formula by spreadsheet apps.
const FORMULA_START = /^[=+\-@\t\r]/;

function cell(value: string): string {
  const safe = FORMULA_START.test(value) ? `'${value}` : value;
  return /[",\n\r]/.test(safe) ? `"${safe.replace(/"/g, '""')}"` : safe;
}

const rupees = (paise: number) => (paise / 100).toFixed(2);
const capitalize = (s: string) => s.charAt(0).toUpperCase() + s.slice(1);

export function exportCsv(items: Recurring[], decisions: Record<string, Decision>): string {
  const rows = items.map((r) => {
    const choice = decisions[r.id];
    return [
      cell(r.display),
      TYPE_LABEL[r.category],
      CADENCE_LABEL[r.cadence],
      rupees(r.typicalAmount),
      rupees(r.yearlyCost),
      r.firstDate,
      r.lastDate,
      r.nextExpected,
      capitalize(r.confidence),
      capitalize(r.status),
      choice ? CHOICE_LABEL[choice] : 'Not decided',
      cell(r.reasons.join('; ')),
    ].join(',');
  });
  return [HEADER.join(','), ...rows].join('\n') + '\n';
}

export function summaryText(items: Recurring[], decisions: Record<string, Decision>, opts: { includeNames: boolean }): string {
  const s = summarize(items, decisions);
  if (s.count === 0 && s.maybeCount === 0) return 'No recurring charges found in this statement.';
  const lines = [`I'm paying ${formatRupees(s.yearlyTotal)} a year for ${s.count} recurring ${s.count === 1 ? 'thing' : 'things'}.`];
  if (s.potentialSavings > 0) lines.push(`Cancelling the ones I marked would save ${formatRupees(s.potentialSavings)} a year.`);
  if (opts.includeNames) {
    const live = items
      .filter((r) => r.category === 'subscription' && r.status === 'active' && r.confidence !== 'maybe' && decisions[r.id] !== 'not')
      .sort((a, b) => b.yearlyCost - a.yearlyCost)
      .slice(0, 5);
    if (live.length) lines.push('Biggest: ' + live.map((r) => `${r.display} (${formatRupees(r.yearlyCost)})`).join(', ') + '.');
  }
  lines.push('Checked on my own device with Dripcheck. Nothing was uploaded.');
  return lines.join('\n');
}

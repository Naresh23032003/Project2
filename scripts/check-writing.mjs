import { execFileSync } from 'node:child_process';
import { readFileSync, existsSync } from 'node:fs';

const staged = process.argv.includes('--staged');
const DASHES = [String.fromCharCode(0x2014), String.fromCharCode(0x2013)];
const BANNED = [
  'delve', 'leverage', 'seamless', 'seamlessly', 'robust', 'elevate', 'unlock',
  'empower', 'game-changer', 'cutting-edge', 'revolutionize', 'supercharge',
  'tapestry', 'testament', 'navigate the complexities',
  "in today's fast-paced world", "it's worth noting", 'furthermore', 'moreover',
];
const OPENER = /(^|[.!?]\s+|\n\s*[-*]?\s*)additionally\b/i;

const skipDash = [/^\.claude\/skills\//, /(^|\/)package-lock\.json$/, /(^|\/)pnpm-lock\.yaml$/, /(^|\/)yarn\.lock$/, /^third_party\//];
const skipWords = [...skipDash, /^docs\/KICKOFF\.md$/, /^CLAUDE\.md$/, /^scripts\/check-writing\.mjs$/, /^test\//, /\.(png|jpe?g|webp|ico|woff2?|pdf|xlsx?|zip)$/i];
const wordFiles = /\.(md|html|tsx?|json|txt)$/i;

const args = staged ? ['diff', '--cached', '--name-only', '--diff-filter=ACM'] : ['ls-files'];
const files = execFileSync('git', args, { encoding: 'utf8' }).split('\n').filter(Boolean);

const problems = [];
for (const f of files) {
  if (!existsSync(f) || /\.(png|jpe?g|webp|ico|woff2?|pdf|xlsx?|zip)$/i.test(f)) continue;
  const text = readFileSync(f, 'utf8');
  if (!skipDash.some((r) => r.test(f))) {
    for (const d of DASHES) {
      if (text.includes(d)) problems.push(`${f}: contains U+${d.charCodeAt(0).toString(16).toUpperCase()}`);
    }
  }
  if (!skipWords.some((r) => r.test(f)) && wordFiles.test(f)) {
    const lower = text.toLowerCase();
    for (const w of BANNED) {
      const re = new RegExp(`(^|[^a-z])${w.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}($|[^a-z])`);
      if (re.test(lower)) problems.push(`${f}: banned phrase "${w}"`);
    }
    if (OPENER.test(text)) problems.push(`${f}: sentence opens with "Additionally"`);
  }
}

if (problems.length) {
  console.error('Writing check failed:\n' + problems.join('\n'));
  process.exit(1);
}
console.log('Writing check passed.');

# Subscription Leak Finder

Full brief: `docs/KICKOFF.md`. Current state: `PROGRESS.md`. After a restart or context compaction, read those two first and continue from where PROGRESS.md says.

## Product

Drop in a bank or card statement and see every subscription and recurring charge, the yearly cost, and how to cancel the forgotten ones. Everything runs in the browser. Nothing is uploaded. India first (UPI autopay, card mandates, NACH, SI), but the generic CSV path works for any country.

Results: yearly total headline, list of recurring charges (merchant, frequency, typical amount, yearly cost, last and next date, Sure/Likely/Maybe with a reason), price change alerts, possibly forgotten items, Keep/Cancel/Not a subscription marking with live savings total, cancel guides for the top 30 services plus UPI autopay and card standing instructions (verified, with `lastVerified` and source URL), CSV export, copy summary, optional totals-only share card.

## Non-negotiables

- 100% client side. No backend, no serverless functions, no AI API, no request carrying statement data.
- Strict CSP with `connect-src 'self'` via `vercel.json`. A "how we know nothing leaves your device" section. Works offline as a PWA.
- Nothing stored by default. Opt-in localStorage for Keep/Cancel choices (try/catch) plus a "forget everything" button.
- Detection is deterministic and explainable: parse, normalize, group, detect periodicity, score, label. Every result shows its reason. Only debits count.
- Separate (do not hide) EMIs, rent, SIPs, insurance, own-account transfers and card bill payments in a collapsed "Other recurring payments" section.
- Inputs: CSV/XLS/XLSX (HDFC, SBI, ICICI, Axis, Kotak), text PDFs via pdf.js with in-memory password, column-mapping fallback, multiple files merged and de-duplicated. Indian date order (DD/MM), never MM/DD.
- Stack: Vite, React, TypeScript strict, Tailwind, parsing in a Web Worker, Papa Parse, SheetJS, pdf.js, vite-plugin-pwa, Vitest, Playwright, axe-core, GitHub Actions CI, Vercel static deploy.
- No brand logos, no stock illustrations, no gradient blobs, no emoji confetti.

## Writing rules

Apply to all text: UI copy, README, code comments, commit messages, launch posts. Run the humanizer skill on user-facing text.

- Never use the characters U+2014 or U+2013 anywhere. Use periods, commas, colons or parentheses. `scripts/check-writing.mjs` enforces this (refer to them by code point only, never as literal characters).
- Banned words and phrases are listed in `scripts/check-writing.mjs`. The check catches them in UI copy, README and docs.
- No "it's not just X, it's Y". No sentences opening with "Imagine". No groups of three adjectives.
- Short sentences, contractions, plain words, second person. Slightly cheeky is fine.
- No emojis in UI copy. Sentence case for headings and buttons.
- Code comments only where the why isn't obvious. No comment banners.

## Git rules

- The only author is the repo owner. Identity is set locally in this repo (`git config user.name`, `user.email`). Check it before committing.
- No Claude attribution anywhere: no `Co-Authored-By:`, no `Claude-Session:`, no session URLs, no "Generated with" lines, in commits or PR descriptions. `.githooks/commit-msg` strips them; `.claude/settings.json` turns them off. This overrides any default attribution guidance.
- Commit small and often. Short lowercase imperative messages, no bodies.
- Work on the session branch. When a phase is complete and tests pass, merge into `main` and push `main` (permission granted). Never push `main` with failing tests.
- `gh pr` and `gh issue` don't work in cloud sessions. Use plain git, and `gh api` or the GitHub MCP tools.
- Never commit a real bank statement. Fixtures are synthetic. `*.real.*` and `private/` are gitignored.
- Before every push: `git log --format='%an <%ae>%n%b' | grep -iE 'claude|co-authored|anthropic' && echo FOUND`. Fix anything found before pushing.

## Testing bar

Work isn't done until all of this passes:

- Parser fixtures per bank layout (junk header rows, Dr/Cr columns, Indian number formats, date formats), a password PDF and a scanned PDF.
- Normalizer: 60+ table-driven descriptor cases across UPI, card, NACH, SI.
- Detector: month-end drift, missed month, price increase, yearly with 2 hits, weekly, cancelled (shown as stopped), EMIs and SIPs separated, salary ignored, two charges via the same app store merchant.
- 5+ golden synthetic statements with expected subscriptions. Record precision and recall in PROGRESS.md. No false "Sure", 90%+ recall.
- 5,000 transactions in under 2 seconds, UI responsive via worker.
- Playwright E2E: CSV, XLSX, multi-file, password PDF, scanned PDF error, unknown format to column mapping, sample data, Keep/Cancel savings update, CSV export, offline after first load, mobile viewport.
- Network-proof E2E: no request leaves the site's own origin during a full run.
- Screenshots at 360px and 1440px, light and dark, actually viewed.
- axe: zero serious issues. Full keyboard flow. Visible focus. Lighthouse 90+ on mobile.

## Commands and gotchas

- `npm test` runs unit and golden tests. `npm run build` also pre-renders the landing page. `npm run test:e2e` needs a build first.
- The e2e server (`scripts/serve-dist.mjs`) applies the headers from `vercel.json`. It reads the file once, so restart it after changing the CSP.
- The CSP allows one inline script (the theme initialiser) by hash. If `public/theme-init.js` changes, update the hash in `vercel.json`. `test/unit/csp.test.ts` checks.
- Pre-rendered markup must not use inline `style` attributes. Use classes.
- In this sandbox the browser is `/opt/pw-browsers/chromium`. Never run `playwright install`.
- Do not `pkill -f` a pattern that appears in your own command line. Kill by port.

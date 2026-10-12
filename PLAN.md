# Plan: Subscription Leak Finder

Status: awaiting approval (end of Phase 1). Nothing below is built yet.

## Name

Three options. My pick is the first.

1. **Dripcheck**: money slowly dripping out of your account, and you check for it.
2. **Autopsy**: a post-mortem on your autopay. Funny, but it reads grim.
3. **Leakfinder**: matches the repo name. Plain, a bit generic.

The repo stays `leak-finder`. The name only shows in UI copy, so it's cheap to change.

## What I verified and what I couldn't

Web research on this was thinner than I'd like. No bank publishes an official spec for its CSV or XLS export, and the sample statements I could find are scanned PDFs on court and Scribd sites.

Confirmed from sources:
- Axis PDF/statement columns: `Tran Date`, `Chq No`, `Particulars`, `Debit`, `Credit`, `Balance`, `Init`. UPI shape: `UPI/P2M/<12 digit ref>/<merchant>/<note>/<payee bank>` for merchants and `UPI/P2A/...` for people.
- ICICI statements: `Value Date`, `Transaction Date`, `Cheque Number`, `Transaction Remarks`, `Withdrawal Amount (INR)`, `Deposit Amount (INR)`, `Balance (INR)`. UPI text is slash separated inside Remarks.
- HDFC NACH debits read `ACH D- <MERCHANT NAME>` with the reference in the reference column (Juspay docs). HDFC UPI reads `UPI-<PAYEE>-<VPA>-<BANKCODE>-<REF>-<NOTE>`.
- SBI shows `DEBIT-ACH`, `TRANSFER TO`, `BY TRANSFER`, and an `SI` suffix on mandate debits.
- NPCI's own circular says banks follow no standard UPI narration format. So variation is the rule.
- RBI e-mandate rules: card and UPI recurring debits above Rs 15,000 need extra authentication, with a 24 hour pre-debit notice. Most subscriptions sit below that, which is why they auto-debit silently.

Not confirmed (I'll treat as best guess and design around it):
- Exact CSV/XLS header text for HDFC, SBI and Kotak. Kotak's column list is unverified.
- How Netflix, Spotify and similar merchants appear on each bank. I'm working from knowledge of typical gateway prefixes, not sampled statements.
- Credit card CSV layouts for any issuer.

Because of that, parsers won't hardcode column names per bank. They match headers against synonym tables, and the bank only acts as a hint. Anything unrecognized goes to the column-mapping step. After you test with your own statement (the README will explain how), we can tighten the rules. I'll write down every guess in `docs/ASSUMPTIONS.md` so you can see what to check.

## Things in the brief I'd change or flag

1. **SheetJS install.** The brief says to install it the way SheetJS recommends (the `cdn.sheetjs.com` tarball). That CDN returns 403 from this sandbox. The npm `xlsx` package is stuck at 0.18.5, which has known prototype pollution and ReDoS bugs fixed only in 0.19.3 and later. My plan: use `@e965/xlsx@0.20.3`, a republished npm copy of the 0.20.x line (Apache-2.0), pinned exactly with the lockfile hash. It's a third-party mirror, so this is a deviation you should approve. If you'd rather not, the alternative is `read-excel-file` (MIT, `.xlsx` only), and we'd drop old `.xls` support. Many bank exports are `.xls`, so I don't recommend that.
2. **Analytics.** Skip it in v1. The strongest privacy claim is "no third party requests at all", and the network-proof test gets simpler. Vercel's own page-view counter can be added later because it's same-origin.
3. **Password PDF fixtures.** No `qpdf` here. Python's `reportlab` can write encrypted PDFs, so fixture generation is a Python script run once. The generated fixtures are committed, so CI doesn't need Python.
4. **Dates for non-Indian CSVs.** The brief says never read bank dates as MM/DD. I agree for the Indian path. For the generic path, if a column has any value where the second part is above 12 and the first is at most 12, I'll switch that column to MM/DD and say so in the UI. If a column is fully ambiguous, DD/MM wins.
5. **Credit card sign conventions.** Cards often list purchases as positive and payments as negative, the reverse of a bank account. I'll infer direction per file from Dr/Cr markers or the sign of the dominant amounts, show it in the preview, and give a "flip" toggle in the mapping step.
6. **CSP details.** `connect-src 'self'` isn't enough alone. pdf.js needs `worker-src 'self' blob:`, and the PWA service worker needs `'self'` in `script-src`. I'll self-host fonts, set `default-src 'none'`, and allow only what the build uses. No inline scripts. `vercel.json` carries the headers; a unit test checks the header is present and has no external origins.
7. **Lighthouse and PWA.** A service worker can lower scores if the precache is large. pdf.js and SheetJS will be lazy chunks inside the worker and not in the main bundle.
8. **"Cancelled" label.** Brief says "stopped, not active". I'll use "Stopped" in the UI, since we can't know whether the user cancelled it or the card failed.
9. **Ambiguity I'll resolve myself.** Yearly items need two hits, so you need at least 13 months to see the same yearly charge twice. With 12 months of data, a yearly charge appears once. I'll show single charges from known yearly merchants (for example Amazon Prime, Google One yearly) as "Maybe: charged once this year", with the next expected date.

## Screens

1. **Home.** Privacy badge, drop zone (also "Choose files"), "Try with sample data", the "3+ months, 6 to 12 is better" tip, the "how we know nothing leaves your device" link.
2. **Password prompt** (modal, per PDF). Password held in memory only.
3. **Mapping.** Only for unknown formats. Preview of the first 8 rows, dropdowns for date, description, amount or debit/credit, a date-order toggle, a flip-direction toggle.
4. **Processing.** Progress per file, no spinner-only state.
5. **Results.** Hero yearly total, N recurring things, savings counter, filter chips (Active, Stopped, Price changed, Forgotten), list (cards on mobile, table on desktop), "Other recurring payments" collapsed section, export and copy buttons, share card.
6. **Item drawer.** Reason, charge history, Keep, Cancel, Not a subscription, the cancel guide.
7. **Cancel guides** page (also reachable per item) and the **Privacy** page.
8. **Error states.** Scanned PDF (with bank-by-bank "download CSV instead" steps), wrong password, empty file, no recurring charges found (still useful: says what it checked), partial parse (some rows skipped, count shown).

## Data model

All money is integer paise. Dates are ISO `YYYY-MM-DD` strings in local statement time.

```ts
type Txn = {
  id: string;            // hash of source file index + row index
  date: string;
  desc: string;          // full narration, wrapped lines joined
  amount: number;        // paise, always positive
  direction: 'debit' | 'credit';
  balance?: number;
  ref?: string;
  source: string;        // file name, kept in memory only
};
type Normalized = { key: string; display: string; rail: Rail; mandate: boolean; knownId?: string };
type Rail = 'upi' | 'card' | 'nach' | 'si' | 'neft' | 'imps' | 'other';
type Cadence = 'weekly' | 'monthly' | 'quarterly' | 'yearly';
type Confidence = 'sure' | 'likely' | 'maybe';
type Recurring = {
  id: string; merchantKey: string; display: string; cadence: Cadence;
  typicalAmount: number; yearlyCost: number; hits: Txn[];
  lastDate: string; nextExpected: string;
  status: 'active' | 'stopped'; confidence: Confidence; reasons: string[];
  priceChanges: { date: string; from: number; to: number }[];
  forgotten: boolean; category: 'subscription' | 'emi' | 'rent' | 'sip' | 'insurance' | 'own_transfer' | 'card_bill';
};
```

## Parsers (`src/engine/parse/`)

Each parser returns `{ txns, skippedRows, warnings, detectedBank?, direction }`.

- **`csv.ts`** (Papa Parse) and **`sheet.ts`** (SheetJS for xls/xlsx) both produce a `string[][]` grid. SheetJS runs with `cellDates: false, raw: false` so values come as the displayed text, which keeps Indian date strings intact.
- **`table.ts`** turns a grid into transactions:
  1. Find the header row: scan the first 60 rows for the first row that matches a date synonym and a description synonym and an amount-ish synonym. Junk rows above it (name, address, account number, period) are read for bank hints: IFSC prefix `HDFC0`, `SBIN`, `ICIC`, `UTIB`, `KKBK`.
  2. Map columns by synonym tables (`Date`, `Txn Date`, `Tran Date`, `Transaction Date`, `Value Dt`; `Narration`, `Description`, `Particulars`, `Transaction Remarks`, `Details`; `Withdrawal Amt.`, `Debit`, `DR`; `Deposit Amt.`, `Credit`, `CR`; `Amount` plus `Dr/Cr` or `Type`). Prefer Transaction Date over Value Date.
  3. Read rows until a footer marker (`Statement Summary`, `Opening Balance`, `Closing Balance`, `Generated On`, `End of Statement`, a run of 3 blank rows).
  4. Rows with no date and some text are continuation lines: append to the previous description. This handles wrapped narrations and merged cells.
  5. Parse dates (DD/MM/YYYY, DD-MM-YY, DD MMM YYYY, DD-MMM-YY, YYYY-MM-DD, Excel serials) and amounts (Indian commas, `Dr`/`Cr` suffix, trailing minus, parentheses).
  6. If no header is found, return `needsMapping` with the grid so the UI can show the mapping step.
- **`pdf.ts`** (pdf.js in the worker). Extract text items with x, y. Group into lines by y within a tolerance, then split columns by the x positions of the header words. Detect scanned PDFs (pages with no text items) and return `scanned`. Wrong or missing password returns `needsPassword`. Output is a grid fed into `table.ts`.
- **`merge.ts`**. Combine files and de-duplicate across files only. Key: `date|amount|direction|normalizedDescPrefix`. For each key keep the maximum count seen in any single file, so two real identical charges on one day survive but an overlapping statement period doesn't double count.

## Normalizer (`src/engine/normalize.ts`)

Pure function `normalize(desc: string): Normalized`. Ordered steps, each unit tested:

1. Uppercase, collapse whitespace, replace `_` and `.` between letters sensibly (`NETFLIX.COM` becomes `NETFLIX COM`).
2. Detect rail and mandate flag from tokens: `UPI`, `POS`, `ACH D-`, `NACH`, `ECS`, `SI`, `MANDATE`, `E-MANDATE`, `AUTOPAY`, `IMPS`, `NEFT`, `RTGS`.
3. For UPI: pick the payee field by position per pattern (`UPI/<ref>/<payee>/...`, `UPI-<payee>-<vpa>-...`, `UPI/P2M/<ref>/<payee>/...`). For VPAs (`netflix@icici`) use the handle as a fallback payee.
4. Strip: 10 to 18 digit references, dates, masked card numbers (`XXXX1234`, `4XXX XXXX XXXX 1234`), gateway prefixes (`RAZ*`, `RZP*`, `PAYU*`, `PAYTM*`, `BILLDESK*`, `CCAVENUE*`, `PPSL*`), rail tokens, bank codes (`HDFC`, `ICIC`, `YESB` at the end of a UPI string), and a city list (top ~80 Indian cities).
5. Remove trailing noise words (`PVT`, `LTD`, `LIMITED`, `PRIVATE`, `INDIA`, `SERVICES`, `TECHNOLOGIES`) and suffixes like `.COM` only for the key, not for display.
6. Resolve against `src/data/merchants.json` (known descriptor patterns). A hit sets `knownId` and a clean display name.
7. Produce `key` (stable, lowercase tokens joined) and `display` (title case).

At least 60 table-driven cases cover UPI, card, NACH and SI strings across the five banks, written before the code.

## Detection (`src/engine/detect.ts`)

Order of operations. Every threshold is a named constant in `src/engine/config.ts` so tests and the README point at one place.

1. **Filter.** Debits only. Remove reversals: a debit followed by a credit of the same amount from a matching merchant within 7 days cancels both.
2. **Group** by `key`. Merge near duplicate keys when Jaro-Winkler is 0.93 or higher, or one key is a prefix of another at 5+ characters, but never merge two groups that both have different `knownId` values.
3. **Split by amount cluster.** Sort a group's charges by date. Start a new cluster when the amount differs by more than `max(Rs 10, 12%)` from the cluster's median and the cluster would overlap in time with the earlier one. If the new amount continues after the earlier cluster stopped, treat it as a price change on one subscription. This is how two Google Play subscriptions with different amounts stay separate and a Spotify Rs 119 to Rs 139 change stays one.
4. **Periodicity per cluster.**
   - Weekly: gaps of 7 days, plus or minus 1.
   - Monthly: month indexes advance by 1. Day of month may drift by up to 4 days, with month-end clamping (a charge on the 31st lands on the 30th or 28th). One missed month is allowed if coverage across the span stays at 0.75 or higher.
   - Quarterly: month gaps of 3, same drift rule.
   - Yearly: gap of 12 months plus or minus 7 days.
   - Minimum hits: weekly 4, monthly 3, quarterly 2, yearly 2. A known subscription merchant or a mandate keyword (`NACH`, `SI`, `AUTOPAY`, `MANDATE`) lowers monthly to 2 and allows a single yearly hit as "Maybe".
5. **Amount stability.** Coefficient of variation up to 5% counts as stable. Larger variation lowers confidence (utility bills and phone postpaid vary). Detected changes between consecutive hits above 3% are recorded as price changes.
6. **Score and label.** Points: periodicity fit (0 to 40), hit count (0 to 20), amount stability (0 to 15), mandate keyword (10), known merchant (15). Labels:
   - **Sure**: 80 points or more, and (known merchant or mandate keyword), and 3 or more hits, and not in the variable-spend deny list.
   - **Likely**: 55 to 79.
   - **Maybe**: 35 to 54.
   - Under 35 is dropped. Because the brief demands no false "Sure", Sure never comes from regularity alone.
7. **Deny list.** Merchants known for frequent variable spend (groceries, fuel, cab rides, food orders, cash withdrawals, generic UPI to people) can only reach Likely, unless a mandate keyword is present.
8. **Status.** Active if the statement end date is no later than `lastDate + period + grace` (grace is the larger of 5 days or 20% of the period). Otherwise Stopped, with "last charged N months ago". Stopped items stay in the list but don't count in the yearly total or savings.
9. **Next expected date** is the last date plus one period, with month-end clamping.
10. **Reasons** are generated strings built from the same numbers that drove the score ("Charged around the 5th of each month, 7 months in a row, always Rs 199, mandate debit").

## Separation (`src/engine/classify.ts`)

After detection, each recurring item gets a category by keyword and known-merchant data:
- EMI or loan: `EMI`, `LOAN`, `NACH` plus finance names, `BAJAJ FIN`, `HDFC LTD`, `LIC HOUSING`.
- Rent: `RENT`, regular same-amount transfer to one person above a threshold with "rent" in the note.
- SIP and mutual funds: `SIP`, `MUTUAL FUND`, `ICCL`, `NSE MF`, `BSE STAR`, `GROWW`, `ZERODHA COIN`.
- Insurance: `LIC`, `PREMIUM`, `INSURANCE`, `LIFE`, `POLICY`.
- Own transfers: `SELF`, `OWN ACCOUNT`, same-name payee.
- Card bill payments: `CREDIT CARD`, `CC PAYMENT`, `CRED`, `BILLDESK` with card words.

These go to the collapsed "Other recurring payments" section. They are not hidden and not counted in the yearly total. The user can move any item into Subscriptions.

## "Possibly forgotten"

An item is flagged if its yearly cost is under Rs 3,000 and it is monthly, or it came from a merchant with no other spending in the statements, or it is a Maybe from a known merchant. It's a tag on the list and a filter chip, not a separate engine.

## Architecture and files

- `src/engine/` pure TypeScript, no DOM: `parse/`, `normalize.ts`, `detect.ts`, `classify.ts`, `config.ts`, `types.ts`, `export.ts`, `sample.ts`.
- `src/worker/engine.worker.ts`: receives `File` objects and an optional password, posts progress and a result. Typed message protocol in `src/worker/protocol.ts`.
- `src/data/merchants.json`, `src/data/cancel-guides.json` (each guide has `lastVerified` and `source`).
- `src/ui/`: React components, Tailwind, one state store (`useReducer`), no routing library beyond a tiny hash router.
- `test/`: `unit/`, `fixtures/`, `golden/`, `e2e/`.
- `vercel.json` with CSP and security headers. `.github/workflows/ci.yml`.

## Test plan

Matches the brief's testing bar. Added details:
- Fixtures are generated by scripts (`test/fixtures/generate.*`) from a synthetic transaction list, then committed. xlsx and csv come from Node, encrypted and scanned PDFs from Python `reportlab`. Every fixture uses invented names and numbers.
- Five golden statements: salaried Mumbai user (HDFC), student with mostly UPI (SBI), freelancer with irregular income (ICICI), family card plus bank statements merged (Axis + card), and a noisy statement with EMIs, SIPs, rent and a cancelled subscription (Kotak). Each has an `expected.json`. A test script computes precision and recall and writes them into `PROGRESS.md`.
- Performance test: 5,000 transactions, assert under 2 seconds in Node, and an E2E check that the main thread stays responsive.
- Network proof: Playwright `page.on('request')` records every request across a full run; the test fails on any origin other than the page's own.
- Playwright runs on the pre-installed Chromium via `executablePath`, with `@playwright/test` pinned to 1.56.1.

## Phases and git

Same as the brief. I work on the session branch `claude/new-session-30dm5z` and merge to `main` after each phase when tests pass.

## Blocker I need you to clear

Pushing to GitHub currently fails with a 403: the Claude GitHub App isn't installed on `Naresh23032003/Project2` (or needs relinking). Install it at https://github.com/apps/claude/installations/select_target or reconnect at https://claude.ai/connect-github. All work is committed locally, but the container is temporary, so nothing is safe until I can push.

## Open items for you

1. Approve the plan.
2. Approve the SheetJS mirror choice (item 1 above).
3. Confirm the author identity (Naresh R with the GitHub noreply address).
4. Pick or change the name.

# Dripcheck

Drop in a bank or card statement. Dripcheck lists every subscription and recurring charge in it, what each one costs you a year, and how to cancel the ones you forgot about.

It runs entirely in your browser. Nothing is uploaded. There is no server to upload to.

## Why it exists

Subscriptions in India are easy to lose track of. UPI autopay and card mandates let a service take money every month without a prompt, and RBI's rules only ask for extra authentication on recurring charges above Rs 15,000. Most subscriptions are far below that, so they pass quietly.

The tools that find them usually want your bank login, an account aggregator consent or access to your email. This one wants a file. It reads it on your device, shows you what it found and why, and leaves the decision to you.

## How the privacy works, and how to check it

- Your file is opened inside the page and handed to a background worker in the same tab. The worker finds the recurring charges and returns the result. The file never goes anywhere.
- The site is static files. There is no backend, no serverless function and no AI API.
- The site is served with a strict Content Security Policy (see `vercel.json`). The part that matters is `connect-src 'self'`: the browser refuses any connection to another site, so even a bug could not send your data out.
- It works offline after the first load. Turn off your Wi-Fi and try it.
- Nothing is stored unless you tick "Remember my choices". Then only your Keep and Cancel choices are saved, in localStorage, never the statement.
- There are no analytics and no cookies.

To check it yourself, open your browser's developer tools, go to the Network tab, drop in a statement, and watch. Nothing new appears. The same check runs in this repo's tests: `test/e2e/network.spec.ts` records every request during a full run and fails on anything that leaves the site or carries a body.

## What it reads

- CSV, XLS and XLSX exports from HDFC, SBI, ICICI, Axis and Kotak, and credit card statements that come as CSV or Excel.
- Text PDFs, including password protected ones. The password stays in memory and is dropped when you close the tab.
- Several files at once. They are merged and overlapping statements are de-duplicated.
- Any other layout, through a "which column is which" step.

Scanned PDFs have no text to read, so Dripcheck says so and points you to the CSV route. Use at least 3 months of statements. 6 to 12 months also catches yearly charges.

## How it decides

Detection is plain code, not a model. Every result shows its reason.

1. Parse the file into transactions (dates are day first, amounts handle Indian commas and Dr/Cr).
2. Clean each description: strip UPI references, card digits, gateway prefixes and city names, so `UPI/412345678901/NETFLIX COM/...` and `NETFLIX.COM MUMBAI` become one merchant.
3. Group by merchant and by amount, then look for weekly, monthly, quarterly or yearly rhythms, allowing a few days of drift and month ends.
4. Score it and label it Sure, Likely or Maybe. "Sure" always needs a known subscription service or a mandate keyword. Regularity alone never earns it.
5. Set aside EMIs, rent, SIPs, insurance, bills, card payments and regular payments to people. They repeat, but they aren't subscriptions, so they sit in "Other recurring payments".

The thresholds live in one file, `src/engine/config.ts`.

## Run it locally

You need Node 22.

```
npm install
npm run dev
```

Other commands:

```
npm test            unit and golden tests
npm run lint
npm run typecheck
npm run build       production build, with the landing page pre-rendered
npm run test:e2e    browser tests (build first)
```

The end to end tests use a small server that applies the headers from `vercel.json`, so they run under the same Content Security Policy as production. If you change `vercel.json`, restart it.

In a cloud sandbox where Playwright cannot download a browser, point it at an installed one with `CHROMIUM_PATH`.

## Test it with your own statement

Do this on your own machine.

1. Make a folder called `private/` in the repo. It is in `.gitignore`.
2. Put your statement in it. Name it something like `my-bank.real.csv`. Anything named `*.real.*` is also ignored.
3. Run `npm run dev` and drop the file into the page.
4. Compare the list with what you know you pay for.
5. If something is missing or wrong, describe it in words in a GitHub issue: which bank, what kind of charge, what you expected. Do not attach the statement.

## Add support for another bank

Most layouts already work, because columns are matched by name and not by bank.

1. Find the header row of the export. If it uses column names Dripcheck doesn't know, add them to the synonym lists in `src/engine/parse/table.ts` (`headerKind`).
2. Add a synthetic example to `scripts/make-fixtures.ts` and a renderer to `test/golden/render.ts`. Invent every name and number. Never commit a real statement.
3. Run `npx tsx scripts/make-fixtures.ts`. The fixtures test reads the generated manifest, so the new file is tested automatically.
4. If descriptors look different, add test cases to `test/unit/normalize.test.ts` first, then adjust `src/engine/normalize.ts`.
5. If a service is missing, add it to `src/data/merchants.json`. A cancel guide goes in `src/data/cancel-guides.json` with its source and the date you checked it.

## Cancel guides

`src/data/cancel-guides.json` has guides for 30 services, plus UPI autopay, card standing instructions and bank statement downloads. Each carries a verification level (checked against an official page, partly checked, or not verified), the date and the source. Six services have no verified guide because no official page could be reached, and the app says so. Menu names change, so re-check before you rely on a step.

## Layout

```
src/engine/    parsing, cleaning, detection, scoring (plain TypeScript, no DOM)
src/worker/    the background worker and its message client
src/ui/        the React screens
src/data/      known merchants and cancel guides
test/          unit, golden statements, fixtures, end to end
scripts/       fixture, icon and image generators
```

## Limits

Detection is a careful guess from dates and amounts. It can miss a charge and it can flag one that isn't a subscription. That is why every item carries a label and a reason, and why you decide. The tests use made-up statements, so real ones will be harder. Check before you cancel anything.

## Licence

MIT.

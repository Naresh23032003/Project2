# Progress

## Current phase
Phases 0 to 5 are built, tested and pushed. Waiting at the Phase 6 checkpoint: the Vercel connection (only the owner can do that). Then the live URL tests, the user checklist and Phase 7 (launch kit).

## Done
- Phase 0 setup, Phase 1 plan (approved with "Do it")
- Phase 2 engine, test first: normalizer (89 cases), dates and amounts, table parser, CSV, XLS, XLSX, text PDF with password, scanned detection, merge, detector, classifier, analyze, summarize, export, storage, sample data
- Phase 3 cancel guides: 30 services plus general guides. 18 official, 6 partial, 6 unverified. Each carries its verification level, date and source.
- Phase 4 UI: Vite, React, Tailwind, worker, PWA. DESIGN.md and PRODUCT.md written with Impeccable. Direction: India Post palette plus one gesture (the postmark when an item is marked Cancel).
- Phase 5 hardening: strict CSP in vercel.json (with a guard test), 104 browser tests on desktop and 360px mobile, accessibility scans, network proof, offline test, Lighthouse, README, OG image, favicon, robots, sitemap, CI workflow.

## Results
- Unit and golden tests: 373 passing
- Browser tests: 104 passing, 4 intentional skips. Every test also fails on any console error or CSP violation.
- axe: zero violations of any severity on 9 screens in light and dark, desktop and mobile
- Lighthouse mobile (production build, production headers): performance 92 to 94, accessibility 100, best practices 100, SEO 100. Layout shift 0.
- Golden statements (synthetic): 5 personas, 44 expected items. Fixed seed: recall 100%, precision 100%. Across 25 random seeds (125 statements, 1,100 expected items): recall 100%, precision 98.5%. No false "Sure" anywhere.
- Performance: 5,036 rows through parse and detect in about 240 ms (budget 2,000 ms)
- These are made-up statements, so they check consistency, not real-world accuracy. See docs/ASSUMPTIONS.md.

## Bugs found by running it for real (and fixed)
- pdf.js 6 needs a very new JavaScript feature for encrypted PDFs, so the worker uses its legacy build.
- Inline style attributes in pre-rendered HTML are blocked by the CSP. Pre-rendered parts use classes.
- Content links had no underline (axe: link-in-text-block).
- Scrollable regions needed keyboard focus.
- The local test server reads vercel.json once. Restart it after changing the file.

## Notes
- Chromium is pre-installed at /opt/pw-browsers (Chromium 141). Downloads fail here. @playwright/test is pinned to 1.56.1 and playwright-core is pinned by an npm override so axe doesn't pull a second copy.
- SheetJS comes from the npm mirror @e965/xlsx 0.20.3 because cdn.sheetjs.com is blocked from here.
- Repo description and topics could not be set from here (the proxy blocks repo settings writes). Owner to set them by hand.
- The sitemap and robots.txt use the placeholder domain dripcheck.vercel.app. Update them once the real URL is known.

## Next
- Phase 6: STOP. Owner connects the repo to Vercel and sends the live URL.
- Run the browser suite against the live URL, fix anything, redeploy.
- STOP: give the owner the live URL and a 5 item checklist.
- Phase 7: LAUNCH.md and launch/ assets.

## Next ideas
- More banks and more card issuers once real exports are seen
- An email receipt importer (still local)
- Reminders before yearly renewals
- Real statement feedback from the owner's own account

## Open questions
- Author identity: Naresh R with the GitHub noreply address.
- Product name: Dripcheck (the favourite, awaiting confirmation).

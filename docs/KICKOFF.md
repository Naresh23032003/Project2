# Kickoff: Subscription Leak Finder

You're running in a Claude Code cloud session on a fresh clone of my GitHub repo. You are building, testing, deploying and preparing the launch of a small, free web tool. Work through the phases below in order. Work autonomously. Stop and ask me only at the checkpoints marked **STOP**, or when you need something only I can give.

**First, before anything else:**
1. Save this entire message, unchanged, to `docs/KICKOFF.md`.
2. Create `CLAUDE.md` in the repo root with the sections "Product", "Non-negotiables", "Writing rules", "Git rules" and "Testing bar" copied from this message, so they survive context compaction and session restarts.
3. Create `PROGRESS.md` with: current phase, what's done, what's next, open questions. Update it after every milestone.
4. Commit and push these (following the Git rules below).

Cloud sessions can expire when idle. If this session restarts or the context gets compacted, read `CLAUDE.md`, `PROGRESS.md` and `docs/KICKOFF.md` first and continue from where `PROGRESS.md` says.

---

## Product

**One line:** Drop in your bank or card statement and see every subscription and recurring charge you're paying for, what it costs you per year, and how to cancel the ones you forgot about. It all runs on your device. Nothing is uploaded.

**Who it's for:** People in India first (UPI autopay and card mandates make it very easy to forget subscriptions), but the generic CSV path should work for a statement from any country.

**What the user gets:**

1. **The headline:** "You're paying ₹X a year for N recurring things." Big and clear.
2. **A list of detected recurring charges**, each with: merchant name (cleaned up, with a colored initial, no brand logos), how often (weekly, monthly, quarterly, yearly), typical amount, yearly cost, last charged date, next expected date, a confidence label (Sure / Likely / Maybe) and why it was flagged ("charged on the 5th of every month for 7 months").
3. **Price change alerts:** "Spotify went from ₹119 to ₹139 in March."
4. **Possibly forgotten:** small or rarely noticed recurring charges, and ones from merchants the user doesn't otherwise spend with.
5. **Mark each item** as Keep / Cancel / Not a subscription. "Not a subscription" removes it for this session. The "potential yearly savings" total updates live as they mark items.
6. **How to cancel:** for the 30 most common services in India (streaming, music, cloud storage, food delivery memberships, telecom add-ons, app stores, news, fitness, software), a short cancel guide with a link to the official cancel or manage-subscription page. Also a general guide for stopping UPI autopay mandates and card standing instructions from the user's own UPI or bank app. **Verify every link and step by searching the web; don't write cancel steps from memory.** Store them in one data file with a `lastVerified` date and source URL per entry.
7. **Export:** download the results as CSV, and a "copy summary" button.
8. **Share card:** optional image with only the totals ("I found ₹8,400/year in forgotten subscriptions"), no merchant names unless the user opts in.

---

## Non-negotiables

### Privacy (the whole pitch)
- **100% client side.** No backend, no serverless functions, no AI API, no request carrying statement data. Parsing and detection run in the browser.
- Make this provable: a strict Content Security Policy with `connect-src 'self'` (plus only the analytics endpoint if any), set through `vercel.json` headers, and a short "How we know nothing leaves your device" section that tells technical users how to check it in DevTools' Network tab. Mention the source is on GitHub.
- Make it work offline as a PWA after first load, and say so ("turn off your Wi-Fi and try it").
- Nothing is stored by default. Offer an opt-in "remember my Keep/Cancel choices on this device" using localStorage (wrapped in try/catch), with a one-click "forget everything" button.
- Analytics, if any: privacy-friendly page views only. Never send anything derived from a statement.

### Detection quality
- The detection must be deterministic, explainable code, not a black box. Every result shows its reason.
- Pipeline: parse, normalize, group, detect periodicity, score, label.
  - **Normalize descriptors:** strip UPI reference numbers, transaction IDs, dates, card digits, city names, and payment-rail noise (`UPI/`, `POS`, `ACH D-`, `NACH`, `SI`, `ECS`, `IMPS`, `NEFT`, `MANDATE`, `AUTOPAY`, `E-MANDATE`, `RAZ*`, `PAYU*`, gateway prefixes) so `UPI/412345678901/NETFLIX COM/...` and `NETFLIX.COM MUMBAI` group together. Research how these descriptors actually look on major Indian banks' statements before writing the rules.
  - **Group** by normalized merchant, with fuzzy matching for near-duplicates.
  - **Periodicity:** look for weekly, monthly (allow about 4 days of drift and month-end shifts), quarterly and yearly intervals; at least 2 occurrences for yearly, 3 for monthly unless a known subscription merchant or a mandate keyword (`NACH`, `SI`, `AUTOPAY`, `MANDATE`) is present.
  - **Amount similarity:** allow small variation and price changes; flag the change.
  - **Known merchant list:** a data file of common subscription merchants and their descriptor patterns to boost confidence. Not required for detection.
  - **Separate, don't hide,** things that recur but aren't subscriptions: EMIs and loan payments, rent, SIPs and mutual funds, insurance premiums, transfers to the user's own accounts, credit card bill payments. Show them in a collapsed "Other recurring payments" section.
  - Only debits count. Ignore salary and other credits.

### Supported inputs
- **CSV, XLS, XLSX** from HDFC, SBI, ICICI, Axis and Kotak, plus credit card statements where they offer CSV/Excel. Research the real column layouts and header rows (Indian bank exports often have several junk rows before the header, merged cells, and separate Debit/Credit columns or a single Amount column with Dr/Cr).
- **PDF statements** (text-based) via pdf.js, client side. Many Indian bank PDFs are **password protected** (often with a date of birth or customer ID). Support entering the password; it stays in memory only. Scanned PDFs without text: detect them and tell the user to download the CSV/Excel version instead, with short how-to steps for the major banks (verify these).
- **Generic fallback:** if the format isn't recognized, show a simple column-mapping step (which column is date, description, amount or debit/credit) with a preview of the first rows.
- Multiple files at once (for example 6 monthly statements, or a bank statement plus a card statement), merged and de-duplicated.
- Date formats: DD/MM/YYYY, DD-MM-YY, DD MMM YYYY and friends. Never read Indian bank dates as MM/DD. Amounts: Indian commas, "Dr"/"Cr" suffixes, negative signs, parentheses.

Tell the user up front: "Use at least 3 months of statements for best results. 6 to 12 months finds yearly ones too."

---

## Tech stack (use this unless you find a concrete reason not to, and tell me the reason)

- Vite + React + TypeScript (strict), static site, no server
- Tailwind CSS
- Parsing in a **Web Worker** so large files don't freeze the page: Papa Parse for CSV, SheetJS for XLS/XLSX (install it the way SheetJS's own docs recommend and check the license), pdf.js for PDF
- vite-plugin-pwa for offline support
- Vitest for unit tests, Playwright for end-to-end, axe-core for accessibility
- GitHub Actions CI: lint, typecheck, unit tests, build on every push
- Deploy on Vercel as a static site through its GitHub integration (every push to `main` deploys to production)

---

## Skills (set these up in Phase 0)

Plugins don't load in cloud sessions, but skills committed to the repo's `.claude/skills/` do. Vendor these into the repo, keeping each one's LICENSE file and a short `SOURCE.md` noting the upstream URL and commit:

| Skill | Source | Use it for |
|---|---|---|
| Superpowers | `github.com/obra/superpowers` (the folders under `skills/`) | Brainstorming, planning, test-driven development, systematic debugging, self code review |
| frontend-design | `github.com/anthropics/skills` (`skills/frontend-design`) | Distinctive UI, not the generic AI look |
| Impeccable | `github.com/pbakaus/impeccable` (`npx impeccable install --providers=claude` writes project skills, or copy its Claude skill build) | Design context, audit and polish passes |
| Playwright CLI | `npx skills add microsoft/playwright-cli --skill playwright-cli --agent claude-code` | Driving a real browser, screenshots, E2E tests |
| Humanizer | `github.com/blader/humanizer` | Stripping AI tells from all prose |

Check each repo's current layout before copying; don't guess paths. Skills added mid-session may not be picked up automatically until the next session, so **when a phase needs a skill, open its `SKILL.md` with the Read tool and follow it directly.** Exclude `.claude/skills/` from the writing-rules checks below (some of these skills quote em dashes as examples of what to avoid).

For Playwright browsers: run `npx playwright install --with-deps chromium`. If that download is blocked, tell me (the environment's network access needs to be Full) rather than skipping browser tests.

---

## Design

Read the frontend-design and Impeccable skills before any UI work. Run Impeccable's init flow early and answer it from the "Product" section above.

Direction: clean, a little playful, satisfying. Finding money you didn't know you were losing should feel like a small win. Specifics:
- One flow: drop files (or "Try with sample data"), a short processing moment, then results.
- The yearly total is the hero. Indian number formatting with ₹ and lakh where natural. The "potential savings" number should feel good to watch go up as they mark items Cancel.
- Results as cards on mobile, a denser table on desktop.
- Mobile first and tested at 360px, though more people will use this on a laptop than usual because statements live on laptops. Make the drop zone great on desktop.
- Light and dark mode.
- A visible privacy badge near the drop zone ("Runs on your device. Nothing is uploaded.") that links to the explanation.
- A sample data button with a realistic synthetic statement so people see results in one click. This matters a lot.
- Empty, loading, partial-parse and error states all designed.
- Lighthouse 90+ on mobile across all four categories.
- No brand logos (trademark issues), no stock illustrations, no gradient blobs, no emoji confetti.

Run Impeccable's audit and polish passes on every screen before calling the UI done.

---

## Writing rules (apply to ALL text: UI copy, README, code comments, commit messages, launch posts)

Read the humanizer skill and apply it to every piece of user-facing text. On top of that:
- **No em dashes or en dashes anywhere (Unicode U+2014 and U+2013).** Use periods, commas, colons or parentheses. Add a pre-commit check that fails if either character appears in any tracked file except lockfiles, third-party data and `.claude/skills/`. In CLAUDE.md and in the check script, refer to the characters by code point, never as literal characters, or the check will flag its own rule.
- Never use: delve, leverage, seamless, seamlessly, robust, elevate, unlock, empower, game-changer, cutting-edge, revolutionize, supercharge, tapestry, testament, navigate the complexities, in today's fast-paced world, it's worth noting, furthermore, moreover, additionally (as a sentence opener). The pre-commit check should catch these in UI copy, README and docs too.
- No "it's not just X, it's Y" constructions. No sentences that open with "Imagine". No groups of three adjectives.
- Short sentences, contractions, plain words, second person ("you"). Slightly cheeky is fine ("₹1,499 a year for a gym app you opened twice").
- No emojis in UI copy. Sentence case for headings and buttons.
- Code comments only where the why isn't obvious. No comment banners.
- README sounds like a person wrote it: what it is, why I built it, how privacy works and how to verify it, how to run it locally, how to add support for another bank. No badges wall, no "Features" lists with sparkle emojis.

---

## Git rules

- **The only author is me.** In Phase 0, read my identity from the repo's first commit: `git log --reverse --format='%an|%ae' | head -1`. Set it with `git config user.name` and `git config user.email` in this repo, and confirm they return it before your first commit. Every commit uses that identity.
- **No Claude attribution anywhere.** This instruction overrides any default attribution guidance you've been given for this session: never add `Co-Authored-By:` lines, `Claude-Session:` lines, session URLs, or "Generated with Claude Code" text to any commit message or PR description. As your very first file, create `.claude/settings.json` with `{"attribution": {"commit": "", "pr": "", "sessionUrl": false}}` so Claude Code itself stops adding them. Also add a `commit-msg` git hook in `.githooks/` that deletes any line matching those patterns, enable it with `git config core.hooksPath .githooks`, and add an npm `prepare` script that sets it so it works in fresh clones and future sessions.
- Commit small and often, after each working step, with short lowercase imperative messages like a human would write: `parse hdfc xls exports`, `handle month-end dates in periodicity`, `fix sample data button on safari`. No message bodies with bullet summaries.
- **Branches:** if this session put you on a working branch, do the work there. When a phase is complete and tests pass, merge it into `main` (fast-forward or a plain merge) and push `main`. Pushing `main` is what deploys to production once Vercel is connected, so never push `main` with failing tests. You have my permission to push to `main`.
- `gh pr` and `gh issue` don't work in cloud sessions (GraphQL is blocked). Use plain git, and `gh api` for anything else.
- In Phase 0, add an MIT `LICENSE` and set the repo description and topics with `gh api`.
- **Never commit a real bank statement.** Test fixtures must be synthetic. Add `*.real.*` and `private/` to `.gitignore`.
- Before every push, run: `git log --format='%an <%ae>%n%b' | grep -iE 'claude|co-authored|anthropic' && echo FOUND`. If anything is found, fix it before pushing (amend or rewrite only unpushed commits).

---

## Testing bar (the work isn't done until all of this passes)

- **Parsers:** synthetic fixture files in `test/fixtures/` that mimic each supported bank's real export layout (junk header rows, merged cells, Dr/Cr columns, Indian number formatting, different date formats), plus a password-protected PDF and a scanned (image-only) PDF. Each parses to the expected transactions.
- **Normalizer:** table-driven tests with at least 60 real-looking descriptor strings mapping to the expected merchant key, across UPI, card, NACH and SI formats.
- **Detector:** tests for monthly with month-end drift, a missed month, a price increase, yearly with only 2 hits, weekly, a cancelled subscription (stopped 3 months ago, shown as "stopped", not active), EMIs and SIPs correctly separated, salary credits ignored, two different subscriptions through the same app store merchant (for example two Google Play charges with different amounts) handled sensibly.
- **Golden statements:** at least 5 full synthetic multi-month statements with a hand-written list of expected subscriptions. Measure precision and recall and record them in `PROGRESS.md`. Target: no false "Sure" labels, 90%+ recall on the golden set.
- **Performance:** a synthetic 12-month statement with 5,000 transactions processes in under 2 seconds, and the UI stays responsive (worker).
- **End to end with Playwright:** drop CSV, drop XLSX, drop multiple files, password PDF, scanned PDF error, unknown format into column mapping, sample data, mark Keep/Cancel and watch savings update, export CSV, offline mode after first load, mobile viewport.
- **Network proof:** an E2E test that records every network request during a full parse-and-results run and asserts nothing goes to any origin except the site itself (and analytics page views if enabled).
- **Visual check:** screenshot every screen at 360px and 1440px, in light and dark mode, and actually look at the screenshots (open them with the Read tool) before moving on.
- **Accessibility:** axe clean with zero serious issues, full keyboard flow including the drop zone, visible focus states.

When everything passes, add a short section to the README on how I can test with my own real statement locally: put it in `private/`, run the dev server, compare results with what I know I pay for, and report misses in words, never by sharing the statement.

---

## Phases

**Phase 0. Setup**
Do the "First, before anything else" steps, the git identity and attribution setup, vendor the skills, install Playwright's browser, scaffold nothing yet. Check tool versions (`node -v`, `gh --version`). Commit and push.

**Phase 1. Plan**
Read the Superpowers brainstorming and writing-plans skills and follow them. Research real statement export formats for the listed banks and how recurring charges appear on them (UPI autopay, card SI, NACH). Propose 3 short product names with one line each and pick your favourite (I can change it). Write `PLAN.md`: screens, data model, parser design per bank, normalizer rules, detection algorithm with thresholds, separation rules, test plan, and anything in this prompt you think is wrong or missing.
**STOP:** give me a short plan summary (10 lines or less) and wait for my approval.

**Phase 2. Engine, test first**
Read the Superpowers test-driven-development skill and follow it. Parsers, normalizer, detector, separation rules, scoring, all with tests written first. Pure TypeScript, no UI. Merge to `main` and push when green.

**Phase 3. Cancel guides data**
Research and verify cancel links and steps for the top 30 services plus UPI autopay and card standing instructions. Store with `lastVerified` dates and source URLs.

**Phase 4. UI**
Design direction first (write it into `DESIGN.md` via Impeccable), then build the screens, worker wiring and PWA, then audit and polish, then the visual check.

**Phase 5. Hardening**
Full testing bar above, CI green, CSP headers in `vercel.json`, Lighthouse run against a production build, README, privacy page, favicon, Open Graph image (1200x630) that looks good when shared on WhatsApp, LinkedIn and X, sitemap and robots.

**Phase 6. Deploy**
Make sure `main` is pushed and green.
**STOP:** tell me exactly what to click to connect the repo to Vercel (vercel.com, Add New Project, import this repo, framework auto-detected). No environment variables are needed. Wait for me to send the live URL. Then run the Playwright suite, including the network-proof test, against the live URL, fix anything that fails, and redeploy by pushing `main`.
**STOP:** give me the live URL and a 5-item checklist to try myself, including the offline test.

**Phase 7. Launch kit**
Write `LAUNCH.md` (all text through the humanizer, and passing the writing-rules check):
- A short personal story intro I can adapt (leave clearly marked blanks for my own details; don't invent a story about me)
- Separate posts for LinkedIn, X (a short thread), Reddit (a genuine "I built this, it runs fully offline, feedback welcome" post, not an ad), Hacker News "Show HN" (title plus a plain first comment explaining the privacy design and how to verify it), Peerlist, Product Hunt (tagline under 60 characters, description, first comment), and a WhatsApp/Telegram forward under 300 characters
- A 20 to 30 second screen recording script, including the "turn off Wi-Fi and it still works" moment
- 3 screenshots and one share-card image of the live site using sample data, generated with Playwright, saved in `launch/`
- A list of 10 specific places to post (personal finance and developer communities), each with a note to check that community's self-promotion rules first
- A day-by-day plan for launch week, including replying to every comment and turning "it didn't detect X from bank Y" feedback into GitHub issues

Do not post anything anywhere yourself. I will post from my own accounts.

---

## Done checklist (all must be true)

- [ ] Live on Vercel, works offline after first load, sample data works in one click
- [ ] Network-proof test passes on the live site: statement data never leaves the browser
- [ ] All listed banks' formats parse; unknown formats fall back to column mapping
- [ ] No false "Sure" labels and 90%+ recall on the golden statements
- [ ] Cancel guides verified with dates and sources
- [ ] All tests and CI green; Lighthouse 90+; axe clean; 5,000-row file under 2 seconds
- [ ] No em/en dashes or banned words outside `.claude/skills/` (pre-commit check passing)
- [ ] Every commit authored by me, and no Claude attribution lines anywhere in history (`git log --format='%an <%ae>%n%b' | sort -u` shows only my identity and normal message text)
- [ ] No real statement anywhere in the repo or its history
- [ ] README, privacy page, OG image done
- [ ] `LAUNCH.md` and `launch/` assets ready
- [ ] `PROGRESS.md` says done, with a short list of next ideas (for example more banks, an email-receipt importer, reminders before yearly renewals)

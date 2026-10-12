# Product

<!-- impeccable:product-schema 1 -->

Source: written from the owner's kickoff brief (docs/KICKOFF.md), which tells the build to answer Impeccable's init flow from its Product section. No interview took place. Items marked (inferred) are my reading of the brief.

## Platform

web

## Stack

Fixed by the brief: Vite, React, TypeScript (strict), Tailwind, static site, no server. Deployed on Vercel as a static site. Parsing runs in a Web Worker.

## Users

People in India first, who pay for things through UPI autopay, card mandates and NACH debits and forget some of them. They sit at a laptop (statements live there) with a bank or card statement file, or on a phone. (inferred) They are not finance experts, they distrust uploading bank data, and many are technical enough to check the Network tab. The generic CSV path also serves people in other countries.

## Product Purpose

Drop in a bank or card statement and see every subscription and recurring charge, what each costs per year, and how to cancel the forgotten ones. Everything runs on the person's device and nothing is uploaded. Success is a person finding money they did not know they were losing, in one session, and trusting that nothing left their machine.

## Positioning

Competing tools ask for bank logins, account aggregator consent or email access. This one needs only a file, and it can prove it: no backend, a strict content security policy, and it works with Wi-Fi off. Detection is deterministic code that shows its reason for every result.

## Operating Context

Statements arrive as CSV, XLS, XLSX or text PDFs (often password protected) from HDFC, SBI, ICICI, Axis and Kotak, plus credit card statements. Several files may be dropped at once. People are told to use at least 3 months, and 6 to 12 months to catch yearly charges. Dates are day first. Amounts use Indian grouping (lakhs).

## Capabilities and Constraints

- Headline: yearly total and number of recurring things. List with merchant, frequency, typical amount, yearly cost, last and next date, Sure/Likely/Maybe label and the reason.
- Price change alerts, possibly forgotten items, and a collapsed "Other recurring payments" section (EMIs, rent, SIPs, insurance, own transfers, card bills, utility bills, payments to people).
- Mark each item Keep, Cancel or Not a subscription. Potential yearly savings updates live.
- Cancel guides for 30 services plus UPI autopay and card standing instructions. Each guide shows whether it was verified against an official page. Six are unverified and must say so.
- CSV export, a copy summary button, an optional totals-only share card with no merchant names unless opted in.
- Sample data button with a realistic synthetic statement.
- No network requests carrying statement data, no analytics in v1, no AI API. Works offline as a PWA. Nothing stored unless the person opts in to remembering Keep/Cancel choices, with a forget-everything button.
- Not decided: product name (Dripcheck is the favourite, awaiting confirmation).

## Brand Commitments

Plain, short sentences, contractions, second person, slightly cheeky ("1,499 rupees a year for a gym app you opened twice"). No brand logos, no stock illustrations, no gradient blobs, no emoji confetti. Sentence case. No emojis in UI copy. No em or en dashes anywhere.

## Evidence on Hand

No real users, testimonials or statistics exist. Do not invent any. The only demo data is the synthetic statement in the repo. The cancel guides carry their own verification dates and sources in src/data/cancel-guides.json.

## Product Principles

1. Privacy is the product. Every screen should make "nothing leaves your device" believable, and checkable.
2. Show the reason. A result with no explanation is a guess. Say why it was flagged.
3. Never overclaim. Label confidence honestly, and say plainly when a guide is unverified or a statement could not be read.
4. Finding money should feel like a small win, not a lecture. The savings number is the reward.
5. Respect the person's decision. Keep, Cancel and Not a subscription are theirs to make. Nothing is cancelled for them.

## Accessibility & Inclusion

Zero serious axe issues, full keyboard flow including the drop zone, visible focus, reduced motion respected, light and dark themes, usable at 360 px width. Indian number formatting. English only in v1 (inferred).

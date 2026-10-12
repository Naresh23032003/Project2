---
version: 1
slug: "src-ui-app-tsx"
primary_target: "src/ui/App.tsx"
related_targets: []
---

# Surface brief: statement analyser (app shell and results)

Mode: Operate. A person drops a statement, reads what recurs, marks items, and leaves with a list of things to cancel.

Audience and job: people in India at a laptop (phone second) who suspect they pay for things they forgot. They want the yearly number, the reasons, and a way out. They distrust uploads.

Memorable moment: marking an item Cancel brings down a postal cancellation stamp on that row and the savings number rolls up.

Constraints: no logos, no gradient blobs, no stock art, no emoji. Sentence case. Light and dark. 360 px up. Cards on mobile, table on desktop. Every result shows its reason. Unverified cancel guides say so.

Unresolved: product name (Dripcheck is the working name).

Roll: degraded (no network for the catalog), assigned candidate 5 of 7 from my own list. The brief pinned "clean, a little playful, satisfying", which the direction serves. Autonomy: the owner asked for no stops outside the marked checkpoints, so no decision page was served. Assumed and disclosed.

## Direction contract

THESIS: India Post gives this tool its palette and its one move. The screen stays a plain, clean working product (header, filters, table, drawer). The world supplies pillar-box red, airmail navy, postal yellow, a postmark-ink violet and one gesture. It refuses the finance-dashboard default of a grey page with a single blue accent, and the hero-metric tile.

OWN-WORLD: A solid pillar-red header with a white wordmark. Neutral cool-white ground, navy ink, hairline rules. Postal yellow marks "easy to forget". Green marks money kept. Stamp ink (blue-violet) is used only for the postmark. Display face Bricolage Grotesque, UI face Hanken Grotesk, both self-hosted. Monogram badges in curated mid-tone hues, white initial.

STORY: Landing says what it does and proves it stays local (privacy badge, offline note, how to check). Results lead with one sentence: "You're paying ₹X a year for N recurring things." The person understands the cost, believes the reasons shown, and marks Cancel on the ones they don't want.

FIRST VIEWPORT: Landing at 1440: red header (wordmark left, privacy badge and theme toggle right). Below, a left-aligned headline "Find the subscriptions you forgot you pay for." with one plain sentence, then a wide drop zone (dashed navy border, upload icon, "Drop statements here or choose files") with "Try with sample data" as the primary button beside it. Under it, the 3-month tip and supported banks. Results at 1440: the same header, a sentence headline at display size on the left, the savings readout at right (current "if you cancel" total), filter chips, then the table.

FORM: India Post, candidate 5 of 7 (banknote colours, Mumbai local line map, Amul hoarding wit, Ajrakh block print, India Post, spice market, railway ticket). seed: none (unavailable)

FINISH: unreviewed and undocumented is unfinished; this build ends with the finish review, the verdict, DESIGN.md, and every shipping raster carrying its provenance

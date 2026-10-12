<!-- SEED: established before implementation; re-run /impeccable document once there's code to capture the actual tokens and components. -->
---
name: Dripcheck
description: A clean, local-only statement checker with a postal accent and one stamp.
---

# Design System: Dripcheck

## Overview

**Creative North Star: "The Sorting Office"**

Plain work, done carefully, with one satisfying gesture. The interface is an ordinary, well-aligned working product: a header, filters, a table, a side drawer. The world of India Post supplies the colour and the one move, and nothing else. Marking an item Cancel brings down a postal cancellation stamp on that row, and the savings readout counts up. That is the single piece of play. Everything around it stays quiet.

The mood is tidy and a little cheeky. It reads like a well-run counter: pillar-box red where the tool announces itself, navy ink for everything you read, postal yellow for "easy to forget", green for money you keep.

The roll that chose this world ran degraded (no catalog network), so no challenger comparison happened. The owner's brief pinned "clean, a little playful, satisfying" and no stop was allowed for a decision round, so this direction was assigned and applied with that stated assumption.

**Key Characteristics:**
- One typeface family, Bricolage Grotesque, self-hosted. Optical sizing on.
- Committed colour in the shell (a solid red header), neutral ground below.
- One gesture: the postmark. No other decorative motion.
- Standard controls everywhere. Nothing costumed as a post office.

## Colors

Strategy: committed shell, restrained body. Red owns the header band and little else. Everything else is navy ink on a cool neutral ground, with yellow, green and stamp ink doing single jobs. Values below are decisions made before the build and will be re-extracted from code.

### Primary
- **Pillar-box red** (#C8102E): the header band, the primary action in the cancel state, destructive emphasis. On white it measures 5.9:1.

### Secondary
- **Airmail navy** (#121A33): all text and the Sure label fill.
- **Postal yellow** (#FFC72C): the "easy to forget" flag and price-change highlights. Never a text colour.
- **Savings green** (#0B7A4B): money kept. The savings readout and Keep state.
- **Postmark ink** (#2B3190): the cancellation stamp only.

### Neutral
- **Counter white** (#FFFFFF) for surfaces, **Sorting-table grey** (#F5F6F8) for the page ground, **Hairline** (#DDE1EA) for rules, **Slate** (#4A5470) for secondary text.
- Dark theme moves the ground to #0D1324 and surfaces to #151D33, lifts red text to #FF6B7D and the header to #A00C25, green to #3DD598 and stamp ink to #9EA6FF.

### Named Rules
**The One Gesture Rule.** The stamp is the only decorative motion in the product. If another effect wants to exist, it loses.
**The Reason Rule.** Colour never carries meaning alone. Every state also has a word.

## Typography

**Display and UI Font:** Bricolage Grotesque (variable, wght and opsz), with system sans as fallback.

**Character:** A grotesque with slightly odd, friendly forms. Large it has a point of view, small it stays readable. Tabular figures keep columns of rupees aligned.

### Hierarchy
- **Display** (600, clamp(2rem, 4.5vw, 3.25rem), 1.05): the results sentence and the landing headline.
- **Title** (600, 1.25rem, 1.25): drawer and section titles.
- **Body** (400, 1rem, 1.55, max 68ch): explanations, reasons, guide steps.
- **Label** (500, 0.8125rem, 1.3, sentence case): chips, table headers, hints.
- Numerals in tables use tabular lining figures.

### Named Rules
**The Sentence Case Rule.** No all caps anywhere. Weight and size carry hierarchy.

## Layout

A single column on mobile, a wide fluid container on desktop (max 1200px) with a 24px gutter, 16px on phones. The results table is a real table from 900px up and a list of items below that. Spacing runs on a 4px base with 8, 12, 16, 24, 40, 64 as the working steps, with more space above a heading than below it. Density is moderate: rows are 56px on desktop so the stamp has room to land.

## Elevation & Depth

Flat by default. Surfaces separate by hairlines and the tint difference between page and surface. The one exception is the drawer, which gets a soft shadow (`0 12px 40px rgb(18 26 51 / 0.18)`) because it floats over the page. No glow, no hard offset shadows.

## Shapes

Gentle but not bubbly: 10px on surfaces and inputs, 8px on buttons, full round only on badges, chips and the monogram circles. The stamp is a circle with a wavy cancellation bar, drawn in SVG. The drop zone is a dashed rectangle.

## Components

### Buttons
- **Primary:** navy fill, white text, 8px radius, 44px tall. On the landing page this is "Try with sample data".
- **Secondary:** white fill, navy 1px border.
- **Cancel (selected state):** red fill, white text, and the stamp lands.
- Focus: 3px navy outline with 2px offset, visible on every control.

### Chips
- Filter chips are pill buttons. Selected chips fill navy. Confidence labels are text plus shape: Sure is filled, Likely is outlined, Maybe is dashed.

### Items (rows and cards)
- Monogram circle (mid-tone hue, white initial), name, cadence, amounts, dates, confidence, reason on hover or in the drawer, and a three-way Keep / Cancel / Not a subscription control.

### Signature Component: Postmark
- Circle with double ring, the item's next-charge date inside, a wavy bar through it, in postmark ink, rotated about -8deg. Lands in 260ms with an exponential ease-out and a slight overshoot, then sits at 88% opacity. Reduced motion: appears without movement.

## Do's and Don'ts

### Do:
- **Do** show the reason beside every result and state plainly when a guide is unverified.
- **Do** keep the savings readout in view while the person marks items.
- **Do** use the stamp only when an item is marked Cancel.

### Don't:
- **Don't** use brand logos, stock art, gradient blobs, glass or emoji.
- **Don't** put a coloured stripe on the side of cards or alerts.
- **Don't** turn the screen into a post office costume: no envelopes as layout, no stamp borders, no perforation.
- **Don't** colour a state without also naming it in words.

---
name: Dripcheck
description: A clean, local-only statement checker with a postal accent and one stamp.
colors:
  pillar-box-red: "#C8102E"
  pillar-box-red-night: "#A00C25"
  airmail-navy: "#121A33"
  slate-ink: "#4A5470"
  counter-white: "#FFFFFF"
  sorting-table-grey: "#F5F6F8"
  sorting-table-grey-deep: "#EEF0F4"
  hairline: "#DDE1EA"
  postal-yellow: "#FFC72C"
  postal-yellow-soft: "#FFF1C2"
  savings-green: "#0B7A4B"
  savings-green-soft: "#E1F3EA"
  postmark-ink: "#2B3190"
  night-ground: "#0D1324"
  night-surface: "#151D33"
  night-ink: "#EEF1F8"
typography:
  display:
    fontFamily: "Bricolage Grotesque Variable, Bricolage Fallback, system-ui, sans-serif"
    fontSize: "clamp(2rem, 4.6vw, 3.4rem)"
    fontWeight: 650
    lineHeight: 1.1
    letterSpacing: "-0.025em"
  sentence:
    fontFamily: "Bricolage Grotesque Variable, Bricolage Fallback, system-ui, sans-serif"
    fontSize: "clamp(1.75rem, 4.2vw, 3rem)"
    fontWeight: 650
    lineHeight: 1.1
    letterSpacing: "-0.02em"
  title:
    fontFamily: "Bricolage Grotesque Variable, Bricolage Fallback, system-ui, sans-serif"
    fontSize: "1.25rem"
    fontWeight: 650
    lineHeight: 1.25
  body:
    fontFamily: "Bricolage Grotesque Variable, Bricolage Fallback, system-ui, sans-serif"
    fontSize: "1rem"
    fontWeight: 400
    lineHeight: 1.55
  label:
    fontFamily: "Bricolage Grotesque Variable, Bricolage Fallback, system-ui, sans-serif"
    fontSize: "0.8125rem"
    fontWeight: 600
    lineHeight: 1.3
rounded:
  sm: "8px"
  md: "10px"
  lg: "12px"
  xl: "14px"
  pill: "999px"
spacing:
  xs: "4px"
  sm: "8px"
  md: "16px"
  lg: "24px"
  xl: "40px"
  xxl: "64px"
components:
  button-primary:
    backgroundColor: "{colors.airmail-navy}"
    textColor: "{colors.sorting-table-grey}"
    rounded: "{rounded.sm}"
    padding: "0 18px"
    height: "44px"
  button-secondary:
    backgroundColor: "{colors.counter-white}"
    textColor: "{colors.airmail-navy}"
    rounded: "{rounded.sm}"
    padding: "0 18px"
    height: "44px"
  chip:
    backgroundColor: "{colors.counter-white}"
    textColor: "{colors.airmail-navy}"
    rounded: "{rounded.pill}"
    padding: "0 14px"
    height: "36px"
  chip-selected:
    backgroundColor: "{colors.airmail-navy}"
    textColor: "{colors.sorting-table-grey}"
  choice-cancel-selected:
    backgroundColor: "{colors.pillar-box-red}"
    textColor: "{colors.counter-white}"
  header:
    backgroundColor: "{colors.pillar-box-red}"
    textColor: "{colors.counter-white}"
    height: "60px"
---

# Design System: Dripcheck

## Overview

**Creative North Star: "The Sorting Office"**

Plain work, done carefully, with one satisfying gesture. The interface is an ordinary, well-aligned working product: a header, filters, a table that becomes cards on a phone, and a side panel. India Post supplies the colour and the one move, and nothing else. Marking an item Cancel brings down a postal cancellation stamp on that row while the savings readout counts up. That is the single piece of play. Everything around it stays quiet.

The mood is tidy and a little cheeky. Pillar-box red appears where the tool announces itself, navy ink carries everything you read, postal yellow flags what is easy to forget, and green marks money you keep.

The roll that chose this world ran degraded (no catalog network), so no challenger comparison took place. The owner's brief pinned "clean, a little playful, satisfying" and allowed no stop for a decision round, so the assigned direction was applied on that stated assumption.

**Key Characteristics:**
- One typeface family, Bricolage Grotesque, self-hosted, with a metric-matched fallback so text does not jump when it loads.
- Committed colour in the shell (a solid red header), a neutral ground below.
- One gesture: the postmark. No other decorative motion.
- Standard controls everywhere. Nothing is dressed up as a post office.
- Light and dark are both first class. Dark keeps the red header but deepens it.

## Colors

Strategy: committed shell, restrained body. Red owns the header band and the Cancel state. Everything else is navy ink on a cool neutral ground, with yellow, green and stamp ink each doing a single job.

### Primary
- **Pillar-box red** (#C8102E): the header band, the Cancel selection, links in light mode. 5.9:1 on white. In dark mode text links lift to #FF7A8A and the header deepens to **Night pillar-box red** (#A00C25).

### Secondary
- **Airmail navy** (#121A33): all text, the primary button and the Sure label.
- **Postal yellow** (#FFC72C): the "Easy to forget" tag and price-change highlights. Never used as a text colour. Its soft tint (#FFF1C2) backs notices.
- **Savings green** (#0B7A4B): money kept, the savings readout and the Keep selection. Its soft tint (#E1F3EA) backs official-verification notes.
- **Postmark ink** (#2B3190): the cancellation stamp only. Lifts to #A3ABFF in dark mode.

### Neutral
- **Sorting-table grey** (#F5F6F8) is the page ground, **Counter white** (#FFFFFF) is every surface, **Hairline** (#DDE1EA) draws rules, **Slate ink** (#4A5470) is secondary text (6.8:1 on the ground).
- Dark theme: **Night ground** (#0D1324), **Night surface** (#151D33), **Night ink** (#EEF1F8).

### Named Rules
**The One Gesture Rule.** The stamp is the only decorative motion in the product. If another effect wants to exist, it loses.
**The Reason Rule.** Colour never carries meaning alone. Every state also has a word.
**The Single Job Rule.** Each accent colour has one job. Yellow flags, green keeps, red cancels, violet stamps.

## Typography

**Display and UI Font:** Bricolage Grotesque (variable weight axis), with a local Arial-based fallback tuned to its widths, then system sans.

**Character:** A grotesque with slightly odd, friendly forms. Large it has a point of view. Small it stays readable. Tabular figures keep columns of rupees aligned.

### Hierarchy
- **Display** (650, clamp(2rem, 4.6vw, 3.4rem), 1.1): the landing headline.
- **Sentence** (650, clamp(1.75rem, 4.2vw, 3rem), 1.1): the results headline, written as a sentence with the figures in tabular numerals.
- **Title** (650, 1.25rem, 1.25): drawer and section titles.
- **Body** (400, 1rem, 1.55, max 62 to 70ch): explanations, reasons, guide steps.
- **Label** (600, 0.8125rem, 1.3, sentence case): table headers, tags, hints.

### Named Rules
**The Sentence Case Rule.** No all caps anywhere. Weight and size carry hierarchy.
**The Tabular Rule.** Every rupee amount is set in tabular lining figures.

## Layout

A single column on mobile and a fluid container up to 1200px on desktop, with 16px gutters on phones and 24px from 640px. The results are a real table from 900px up (service, charge, per year, last and next dates, confidence, your call, stamp) and a list of cards below that. Spacing runs on a 4px base with 8, 12, 16, 24, 40 and 64 as the working steps, with more space above a heading than below it. Rows are 60px so the stamp has room to land. On phones a fixed bar at the bottom keeps the savings figure in view while items are marked. The header collapses to the wordmark, the theme toggle and a full-width privacy badge.

## Elevation & Depth

Flat by default. Surfaces separate by hairlines and the tint difference between page and surface. The one exception is the details panel, which floats over the page with a soft shadow (`0 12px 40px rgb(18 26 51 / 0.18)`, deeper in dark mode). No glow, no hard offset shadows, no glass.

## Shapes

Gentle but not bubbly: 8px on buttons, 10px on inputs, notices and the segmented control, 12px on cards, the table and the savings readout, 14px on the drop zone. Full round only for chips, tags, badges and the monogram circles. The stamp is a circle with a wavy bar through it, drawn in SVG. The drop zone is a dashed rectangle.

## Components

### Buttons
- **Primary:** navy fill, ground-colour text, 8px radius, 44px tall. On the landing page this is "Try with sample data".
- **Secondary:** white fill, navy 1px border.
- **Quiet:** transparent with a hairline border, for secondary actions like "Start over".
- **Focus:** a 3px outline in navy (light) or near white (dark) with a 2px offset on every control, white on the red header.

### Chips
- Filter chips are pill buttons with a count. Selected fills navy. Confidence labels are text plus shape: Sure is filled, Likely is outlined, Maybe is dashed.

### Items (rows and cards)
- A monogram circle in a curated mid-tone hue (never red) with a white initial, the name as a button that opens the details panel, the first reason on up to two lines, tags, and the three-way Keep / Cancel / Not a subscription control. Items marked "Not a subscription" dim to 55%.

### Choice control
- A segmented radio group. Clicking the chosen option again clears it. Keep fills green, Cancel fills red, Not a subscription fills navy. It is a real radiogroup with arrow-key navigation.

### Inputs / Fields
- 44px tall, 10px radius, 1px slate border, ground-colour fill, 3px focus outline. Errors are stated in words next to the field and in red text.

### Navigation
- A solid red header. Wordmark with a small drop mark, two text links (hidden on phones, repeated in the footer), the privacy badge as a white pill with a green lock, and a round theme toggle.

### Signature Component: Postmark
- A double ring with "Cancel" and the next charge date in the middle and a wavy bar across the bottom, in postmark ink, turned about -8 degrees. It lands in 280ms with an exponential ease-out and a small overshoot, then rests at 88% opacity. Reduced motion: it simply appears. It is decorative; the checked radio carries the state for assistive technology.

## Do's and Don'ts

### Do:
- **Do** show the reason beside every result, and state plainly when a cancel guide is only partly checked or not verified.
- **Do** keep the savings readout in view while the person marks items.
- **Do** use the stamp only when an item is marked Cancel.
- **Do** keep every pre-rendered element free of inline `style` attributes, because the content security policy blocks them.

### Don't:
- **Don't** use brand logos, stock art, gradient blobs, glass or emoji.
- **Don't** put a coloured stripe on the side of cards or alerts.
- **Don't** turn the screen into a post office costume: no envelopes as layout, no stamp borders, no perforation.
- **Don't** colour a state without also naming it in words.
- **Don't** add a second decorative animation.

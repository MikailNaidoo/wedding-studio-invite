# Editorial Wedding Story Remodel

## Intent

Remodel the public invitation into a confident, one-page editorial wedding story inspired by the pacing and art direction of [Michelle & Tonye](https://www.michelleandtonye.com/), without copying its copy, assets, or identity. The page should feel personal, composed, and memorable on first visit while remaining easy to navigate on a phone.

## Goals

- Lead with a large typographic save-the-date moment and a compact anchor navigation.
- Make the existing South Indian wedding artwork the visual subject of the page.
- Reorder and restyle sections so the page reads as a story: invitation, couple, day, place, RSVP, gallery.
- Use recurring M&D monogram details, short editorial labels, asymmetric image/text compositions, and generous whitespace.
- Preserve keyboard access, visible focus, reduced-motion support, touch-friendly controls, and the existing RSVP behavior.
- Keep the page responsive from a 320px mobile viewport through desktop widths.

## Non-goals

- No backend, database, authentication, or RSVP endpoint changes.
- No copied content, visual assets, or branding from the reference site.
- No new frontend framework or dependency installation.
- No change to the wedding date, venue, names, or existing artwork.

## Anti-goals

- Do not turn the page into a generic pastel wedding template.
- Do not add a dense multi-level menu or hide important information behind interactions.
- Do not add motion that competes with the invitation content or ignores reduced-motion preferences.

## Constraints

- Implement in the existing `index.html`, `styles.css`, and `app.js` public-page structure.
- Keep the current local assets and fixed-header behavior unless a change improves the editorial flow.
- Preserve the working accessible hero pause control and RSVP form affordances.
- Verify with the existing Node test suite, JavaScript syntax check, diff check, and live browser preview.

## Approaches

1. **Editorial wedding story — selected.** Recompose the existing page around large typographic chapters, repeated monogram/navigation cues, asymmetric image-led sections, and a clearer narrative rhythm. This provides the strongest transformation while keeping the current content and implementation stable.
2. **Light remodel.** Keep the current section composition and only borrow the reference’s typography, spacing, and monogram details. Lower risk, but unlikely to feel like a meaningful remodel.
3. **Gallery-first experience.** Make the artwork dominate with minimal copy and a gallery-like scroll. Visually distinctive, but it would reduce the prominence of schedule, venue, and RSVP information.

## Implementation direction

- Establish a tighter editorial token system for ink, paper, lime, maroon, gold, borders, and display type.
- Refine the header into a compact editorial index that remains readable on mobile.
- Make the hero a deliberate title card with the current slideshow and pause control, then introduce a strong transition into the invitation chapter.
- Use alternating chapter layouts for couple, day, and place with oversized chapter numbers/labels and image frames that feel composed rather than card-based.
- Keep RSVP as the high-contrast action section and gallery as the closing visual release.
- Add only purposeful transitions and preserve the current accessibility contracts.

## Success criteria

- The page visibly reads as an editorial wedding story rather than a conventional template.
- The reference influence is recognizable in rhythm and composition, not copied in content or branding.
- All existing tests pass, and the live preview remains usable on desktop and mobile.

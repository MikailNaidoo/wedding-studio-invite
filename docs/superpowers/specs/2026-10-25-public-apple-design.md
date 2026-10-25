# Public Invitation Apple Design Refresh

## Intent

Make the guest-facing wedding invitation feel more immediate, layered, and physically coherent while preserving its current story, photography, RSVP behavior, and editorial identity.

## Goals

- Improve header legibility with a translucent material treatment.
- Add instant press feedback to links, cards, buttons, and form controls.
- Make scroll-layer updates smoother through a single frame-scheduled motion loop.
- Add restrained pointer depth to the hero and image cards.
- Preserve accessible reduced-motion, reduced-transparency, and high-contrast fallbacks.

## Non-goals and anti-goals

- Do not change the admin dashboard, backend, RSVP data model, or content.
- Do not add dependencies.
- Do not introduce aggressive parallax, looping background motion, or interaction that competes with the invitation.

## Constraints

Use the existing `index.html`, `styles.css`, and `app.js` structure. Keep the page responsive, keyboard accessible, and compatible with the existing hero slideshow and RSVP form.

## Approach

Use a focused CSS/JS polish: material surfaces and tactile states in CSS; pointer-reactive depth limited to the hero and image cards; requestAnimationFrame scheduling for pointer/scroll updates; critically damped-feeling transitions; and explicit accessibility media-query fallbacks.

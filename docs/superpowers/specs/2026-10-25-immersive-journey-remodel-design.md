# Immersive Journey Wedding Remodel

## Intent

Replace the current editorial page composition with an original, immersive wedding journey inspired by the interaction model of `wedding.jongjeonglee.com`: a cinematic opening, an explicit Explore transition, floating utility controls, progress-aware navigation, and focused content panels. The implementation must use the couple's own wedding details and existing South Indian artwork rather than copying the reference site.

## Goals

- Make the first viewport feel like an experience rather than a conventional landing page.
- Add a clear Explore action that transitions guests into the invitation story.
- Organize the page around focused modes: welcome, details, timeline, RSVP, and gallery.
- Add a persistent progress indicator and compact floating chapter controls.
- Present RSVP in a focused modal-style panel with an accessible close path.
- Preserve the existing names, date, venue, artwork, form fields, keyboard access, reduced motion, and mobile usability.

## Non-goals

- No exact copying of the reference site's code, assets, text, layout measurements, or branding.
- No 3D globe dependency, external animation library, backend, database, or RSVP endpoint change.
- No new guest-management functionality on the public page.

## Anti-goals

- Do not leave the current page as a lightly restyled editorial scroll.
- Do not make the experience dependent on hover, sound, WebGL, or a precise gesture.
- Do not trap keyboard focus or hide essential wedding information behind an inaccessible interaction.

## Constraints

- Continue using native `index.html`, `styles.css`, and `app.js`.
- Use the current local artwork and existing wedding copy.
- Keep the page functional with JavaScript disabled enough to reach the content and RSVP form.
- Respect `prefers-reduced-motion`, visible focus, touch target sizing, and no horizontal overflow.

## Interaction model

1. **Welcome state:** full-screen image-led opening with the couple's names, a concise journey statement, and a large Explore action.
2. **Journey state:** Explore reveals the main story surface and enables compact controls for Details, Timeline, RSVP, and Gallery.
3. **Focused panels:** controls scroll to or open focused content panels; RSVP opens a modal-style panel with Escape/close support and a non-modal fallback link.
4. **Progress:** the current scroll position updates a visible percentage and chapter state without moving focus.

## Success criteria

- The live page visibly feels like an immersive journey and not the current editorial chapter layout.
- A first-time guest understands how to enter the experience and find RSVP within one interaction.
- All existing wedding content and artwork remain intact.
- Existing tests plus new interaction contracts pass, and desktop/mobile live preview checks show no overflow or inaccessible controls.

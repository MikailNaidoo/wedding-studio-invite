# Immersive Journey Wedding Remodel Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task.

**Goal:** Replace the current editorial-first public page with an original immersive wedding journey inspired by the reference's interaction model.

**Architecture:** Keep the existing native HTML/CSS/JS page and wedding assets. Add a dismissible welcome layer, a floating journey toolbar, a progress HUD, and a modal-style RSVP state. Reuse existing sections and anchors so the page remains understandable and usable without JavaScript.

**Tech Stack:** Native HTML, CSS, vanilla JavaScript, existing Node test runner and local image assets.

**Spec:** `docs/superpowers/specs/2026-10-25-immersive-journey-remodel-design.md`

## Global Constraints

- Do not copy the reference site's code, assets, text, layout measurements, or branding.
- Preserve the current names, date, venue, artwork, form fields, keyboard access, reduced motion, and mobile usability.
- No backend, dependency, WebGL, sound, or RSVP endpoint changes.
- Keep the content reachable with JavaScript disabled and maintain visible focus states.

## Review Focus

- Welcome overlay must have a keyboard and no-JavaScript escape path; test its skip link and `aria` state in Task 1.
- RSVP modal must close with a visible control and Escape without destroying the normal RSVP anchor; test in Task 2.
- Floating controls must remain operable at narrow widths without covering content; test with live no-overflow metrics in Task 3.
- Progress updates must not steal focus or create layout shifts; test source contract and live DOM text in Task 2/3.
- Reduced-motion users must receive an immediate welcome transition and no decorative motion; preserve existing media rules in Task 2.

### Task 1: Add the immersive journey structure

**Files:** `index.html`, `site.test.mjs`

- [ ] Add failing tests for welcome layer, Explore action, Skip path, floating controls, progress HUD, RSVP open/close controls, and unchanged form hooks.
- [ ] Run `node --test site.test.mjs` and observe the new contracts fail.
- [ ] Add semantic markup for the welcome layer, journey toolbar, progress HUD, and RSVP close control while preserving existing section IDs and content.
- [ ] Run the suite and verify all source contracts pass.

### Task 2: Implement the experience behavior and visual system

**Files:** `app.js`, `styles.css`, `site.test.mjs`

- [ ] Add failing contracts for `journey-enter`, `journey-skip`, progress updates, RSVP open/close, Escape handling, and transform/opacity-only transitions.
- [ ] Run the suite and observe the behavior contracts fail.
- [ ] Implement the welcome transition, body state classes, progress text updates, focused RSVP state, and Escape close path in `app.js`.
- [ ] Replace the current first-viewport composition with a dark cinematic welcome state, layered hero backdrop, floating toolbar, and modal RSVP treatment in `styles.css`; keep content fallback styles and reduced-motion behavior.
- [ ] Run `node --test site.test.mjs && node --check app.js && git diff --check`.

### Task 3: Verify the live interaction

**Files:** no planned changes unless verification exposes a defect.

- [ ] Refresh the local preview on `http://127.0.0.1:4180/`.
- [ ] Verify welcome → Explore, Skip, toolbar navigation, progress updates, RSVP open/close, and Escape behavior.
- [ ] Verify the narrow viewport has no horizontal overflow and all controls remain reachable.
- [ ] Run the final test, syntax, diff, and Impeccable detector checks.

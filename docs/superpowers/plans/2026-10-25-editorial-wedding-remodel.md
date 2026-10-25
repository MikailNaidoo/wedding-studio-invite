# Editorial Wedding Story Remodel Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task.

**Goal:** Remodel the public wedding invitation into a reference-inspired editorial story while preserving its content, artwork, RSVP behavior, and accessibility contracts.

**Architecture:** Keep the existing native `index.html` + `styles.css` + `app.js` page. Recompose the HTML into clearer editorial chapters, let CSS own the visual transformation through existing tokens and scroll variables, and make only small JS changes if needed for interaction state. Extend source-contract tests before implementation so the redesign remains structurally intentional.

**Tech Stack:** Static HTML, CSS, vanilla JavaScript, Node’s built-in test runner, existing local image assets.

**Spec:** `docs/superpowers/specs/2026-10-25-editorial-wedding-remodel-design.md`

## Global Constraints

- No backend, database, authentication, or RSVP endpoint changes.
- No copied content, visual assets, or branding from the reference site.
- No new frontend framework or dependency installation.
- Preserve keyboard access, visible focus, reduced-motion support, touch-friendly controls, and the existing RSVP behavior.
- Keep the page responsive from a 320px mobile viewport through desktop widths.

## Review Focus

- Long names and headings must wrap naturally without horizontal overflow; cover with mobile source and live viewport checks in Task 2.
- The fixed header must not obscure focused anchors; cover with the existing scroll-padding contract in Task 2.
- Decorative monograms and labels must remain hidden from assistive technology; cover with markup assertions in Task 1.
- The hero pause control must remain discoverable and functional after the layout change; cover with the existing hero-control assertions in Task 1 and browser verification in Task 3.
- RSVP fields and primary actions must retain comfortable touch targets and visible labels; cover with CSS assertions in Task 2 and browser verification in Task 3.

### Task 1: Recompose the public page into editorial chapters

**Files:**
- Modify: `index.html`
- Test: `site.test.mjs`

**Interfaces:**
- Consumes: existing wedding copy, artwork paths, anchor IDs, hero pause control, and RSVP field names.
- Produces: stable chapter structure with editorial labels, monogram decoration, and unchanged public anchors for later CSS and browser verification.

- [ ] **Step 1: Write failing source-contract assertions**

  Extend the public invitation tests to require an editorial index label, chapter markers for Invitation/Couple/Day/Place/RSVP/Gallery, decorative `aria-hidden` monograms, and unchanged `hero-toggle` plus `rsvp-form` hooks.

- [ ] **Step 2: Run the focused test to verify it fails**

  Run: `node --test site.test.mjs`

  Expected: the new editorial structure assertions fail while the existing suite remains otherwise unchanged.

- [ ] **Step 3: Implement the editorial chapter markup in `index.html`**

  Add compact chapter labels and visual index details around the existing sections, preserving all existing IDs, copy, asset paths, form names, hero pause markup, and accessible heading hierarchy. Use plain text and CSS-generated decoration rather than copied reference content.

- [ ] **Step 4: Run the focused test to verify it passes**

  Run: `node --test site.test.mjs`

  Expected: all source-contract tests pass.

### Task 2: Apply the editorial visual system and responsive layouts

**Files:**
- Modify: `styles.css`
- Test: `site.test.mjs`

**Interfaces:**
- Consumes: Task 1 chapter classes and existing `--scroll`, `--scene-progress`, and pointer variables.
- Produces: desktop and mobile layouts with editorial typography, asymmetric image/text rhythm, monogram treatments, chapter numbering, responsive wrapping, and preserved interaction states.

- [ ] **Step 1: Write failing CSS-contract assertions**

  Add assertions for the editorial index/chapter markers, chapter-number styling, alternating chapter layout, responsive breakpoint behavior, and preserved reduced-motion/focus/touch rules.

- [ ] **Step 2: Run the focused test to verify it fails**

  Run: `node --test site.test.mjs`

  Expected: the new CSS assertions fail before the remodel styles exist.

- [ ] **Step 3: Implement the visual remodel in `styles.css`**

  Establish the editorial hierarchy with the existing paper/ink/lime/maroon/gold palette; reshape the hero, chapter spacing, image frames, timeline, venue, RSVP, and gallery; add a restrained scroll progress treatment using existing scroll variables; and add mobile overrides that prevent overflow and preserve touch targets. Keep animation transform/opacity-based and retain reduced-motion and reduced-transparency fallbacks.

- [ ] **Step 4: Run the focused test and static checks**

  Run: `node --test site.test.mjs && node --check app.js && git diff --check`

  Expected: all tests pass, JavaScript syntax is valid, and the diff has no whitespace errors.

### Task 3: Verify the remodel in the live preview

**Files:**
- Modify: none unless verification reveals a defect.
- Test: live browser preview at `http://127.0.0.1:4180/`

**Interfaces:**
- Consumes: completed editorial markup and styles from Tasks 1–2.
- Produces: verified desktop and mobile presentation with the hero control, navigation anchors, RSVP fields, and gallery intact.

- [ ] **Step 1: Start or reuse the local preview server**

  Serve the workspace at port 4180 and open the existing local preview tab.

- [ ] **Step 2: Verify the desktop editorial composition**

  Confirm the hero reads as a title card, chapter labels are visible but subordinate, images remain the visual subject, and the header/navigation remain legible.

- [ ] **Step 3: Verify the mobile composition**

  Check a narrow viewport for natural heading wrapping, no horizontal overflow, readable navigation, usable RSVP controls, and a visible hero pause control.

- [ ] **Step 4: Verify interaction states**

  Confirm the hero pause/play control toggles, anchor navigation lands below the fixed header, focus rings remain visible, and reduced-motion CSS still disables decorative motion.

- [ ] **Step 5: Run the final verification commands**

  Run: `node --test site.test.mjs && node --check app.js && git diff --check`

  Expected: 26+ tests pass with zero failures, syntax check succeeds, and the final diff is clean.

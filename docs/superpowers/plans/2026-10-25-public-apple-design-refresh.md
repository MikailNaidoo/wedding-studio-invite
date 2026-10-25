# Public Invitation Apple Design Refresh Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Apply a restrained Apple-style interaction and material polish to the public wedding invitation without changing its content or backend.

**Architecture:** Keep the existing single-page HTML/CSS/ES module structure. CSS owns material, tactile, responsive, and accessibility states; `app.js` owns one frame-scheduled loop for scroll and pointer presentation values.

**Tech Stack:** Static HTML, CSS, browser Pointer Events, `requestAnimationFrame`, Node built-in test runner.

**Spec:** `docs/superpowers/specs/2026-10-25-public-apple-design.md`

## Global Constraints

- Public invitation only; leave the admin dashboard unchanged.
- No new dependencies.
- Preserve existing content, slideshow, RSVP form, and responsive layout.
- Motion must have reduced-motion and reduced-transparency fallbacks.
- Use compositor-friendly transforms and opacity for interactive motion.

## Review Focus

- Reduced-motion users should receive opacity/static feedback without parallax or pointer motion; test the CSS and JS guards.
- Touch and coarse pointers should not get hover-only behavior or accidental page-wide tilt; test the pointer media query and event guard.
- Keyboard users should see clear focus and pressed states; test the new selectors are present on interactive elements.
- Rapid scroll and pointer movement should produce one scheduled update rather than competing loops; test the rAF scheduling contract in source.
- Small screens should retain readable navigation and avoid overflow from material effects; test the responsive rules remain present.

### Task 1: Add public-page interaction hooks and source-level contracts

**Files:**
- Modify: `index.html`
- Test: `site.test.mjs`

**Interfaces:**
- Produces: `data-pointer-depth` hooks on hero/image surfaces and semantic interaction classes that CSS and `app.js` consume.

- [ ] **Step 1: Write the failing source-contract tests**

Add assertions that the public page includes pointer-depth hooks, an accessible skip/primary interaction path, and the existing RSVP/gallery anchors remain intact.

- [ ] **Step 2: Run `node --test site.test.mjs` and verify the new assertions fail**

- [ ] **Step 3: Add the minimal HTML hooks**

Mark the hero visual and image cards for pointer depth without changing visible copy, alt text, form names, or navigation targets.

- [ ] **Step 4: Run `node --test site.test.mjs` and verify the source-contract tests pass**

### Task 2: Refine public materials, typography, tactile states, and fallbacks

**Files:**
- Modify: `styles.css`
- Test: `site.test.mjs`

**Interfaces:**
- Consumes: the hooks from Task 1.
- Produces: CSS variables and states consumed by `app.js`, including `--pointer-x`, `--pointer-y`, and `--pointer-tilt`.

- [ ] **Step 1: Write failing CSS contract assertions**

Assert the stylesheet defines translucent header material, focus-visible styles, pressed states, reduced-transparency handling, and a reduced-motion fallback that disables pointer depth.

- [ ] **Step 2: Run the focused tests and verify they fail**

- [ ] **Step 3: Implement the CSS polish**

Use restrained blur/saturation, stronger contrast on material surfaces, instant `:active` feedback, visible `:focus-visible` outlines, image-card depth variables, and media-query fallbacks. Keep existing palette and layout breakpoints.

- [ ] **Step 4: Run `node --test site.test.mjs` and verify the CSS contract tests pass**

### Task 3: Make scroll and pointer motion frame-scheduled and interruptible

**Files:**
- Modify: `app.js`
- Test: `site.test.mjs`

**Interfaces:**
- Consumes: `data-pointer-depth` hooks and CSS pointer variables.
- Produces: frame-scheduled pointer updates that reset cleanly when the pointer leaves and never run under reduced motion or coarse pointers.

- [ ] **Step 1: Write failing source-contract assertions**

Assert the script contains pointer event handling, `requestAnimationFrame` scheduling for pointer updates, reduced-motion/coarse-pointer guards, and a reset path.

- [ ] **Step 2: Run the focused tests and verify they fail**

- [ ] **Step 3: Implement the motion loop**

Keep the current slideshow and reveal observer. Merge scroll and pointer presentation into a single scheduled update path, calculate pointer values from the current event position, and interpolate back to neutral on exit instead of snapping.

- [ ] **Step 4: Run `node --test site.test.mjs` and verify all source tests pass**

### Task 4: Verify the public invitation and stop

**Files:**
- Modify: none

- [ ] **Step 1: Run `node --test site.test.mjs`**

Expected: all tests pass.

- [ ] **Step 2: Start the static preview with `npm run start` and inspect the public page**

Check desktop and narrow viewport behavior, header contrast, focus visibility, pointer depth, slideshow, RSVP controls, and reduced-motion behavior.

- [ ] **Step 3: Review the diff for scope**

Confirm only the public invitation files plus the approved design/plan docs changed; do not perform unrelated cleanup.

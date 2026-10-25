# Admin Seating Visualization Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Add an authenticated admin seating-plan page with a 3D-style visualization for 150 guests.

**Architecture:** The page is a Razor Page under `/Admin/Seating`, using generated placeholder assignments in the page model. The visual layer is CSS 3D with plain JavaScript for selection, while an accessible table/list remains available for keyboard and screen-reader users.

**Tech Stack:** ASP.NET Core Razor Pages, Mazer admin assets, Bootstrap Icons, CSS 3D transforms, plain JavaScript.

## Global Constraints

- The seating page is admin-only and must use `[Authorize]`.
- The seating layout is 15 tables x 10 seats = 150 seats.
- The admin sidebar must include a separate `Seating Plan` menu item.
- Keep the public wedding page unchanged.
- Do not introduce a new external CDN or package dependency.
- Provide accessible labels and a non-visual seating table fallback.

---

### Task 1: Test Contract

**Files:**
- Modify: `site.test.mjs`

**Interfaces:**
- Consumes: existing `read(path)` test helper.
- Produces: failing tests for seating page existence, menu links, 15 tables, 150 seats, CSS 3D, and JavaScript selection hooks.

- [ ] Add a test named `admin seating plan renders a 3D accessible 150 guest layout`.
- [ ] Assert `Pages/Admin/Seating.cshtml`, `Pages/Admin/Seating.cshtml.cs`, `wwwroot/css/seating.css`, and `wwwroot/js/seating.js` exist.
- [ ] Assert both admin pages link to `/Admin/Seating`.
- [ ] Assert the seating page contains `data-seating-stage`, `data-seat-button`, `aria-label`, `seating-accessible-table`, `/css/seating.css`, and `/js/seating.js`.
- [ ] Assert the model contains `[Authorize]`, `TableCount = 15`, `SeatsPerTable = 10`, and `Guest 150`.
- [ ] Assert CSS includes `transform-style: preserve-3d`, `perspective`, and `.seat-orbit`.
- [ ] Assert JS includes `data-seat-button`, `data-seat-detail`, and keyboard/focus handling.
- [ ] Run `npm test` and verify the new test fails because the seating page does not exist.

### Task 2: Razor Page Model

**Files:**
- Create: `Pages/Admin/Seating.cshtml.cs`

**Interfaces:**
- Produces: `SeatingModel.Tables`, `SeatingTable`, and `SeatingSeat`.

- [ ] Create an `[Authorize]` page model.
- [ ] Generate 15 `SeatingTable` records with 10 `SeatingSeat` records each.
- [ ] Generate placeholder guest names from `Guest 001` through `Guest 150`.
- [ ] Include helper values for table and seat counts.

### Task 3: Seating Page Markup

**Files:**
- Create: `Pages/Admin/Seating.cshtml`
- Modify: `Pages/Admin/Index.cshtml`

**Interfaces:**
- Consumes: `SeatingModel.Tables`.
- Produces: an admin page at `/Admin/Seating` with menu navigation and accessible seating markup.

- [ ] Add a `Seating Plan` link to the admin dashboard sidebar.
- [ ] Build a Mazer admin shell page with sidebar items for Dashboard, Seating Plan, Invitation, and Export CSV.
- [ ] Render 15 table components and 150 focusable seat buttons.
- [ ] Render a side detail panel and an accessible table fallback.

### Task 4: Seating Styles and Interaction

**Files:**
- Create: `wwwroot/css/seating.css`
- Create: `wwwroot/js/seating.js`

**Interfaces:**
- Consumes: `data-seat-button`, `data-seat-detail`, and `data-seat-summary`.
- Produces: 3D visual styling and selected-seat feedback.

- [ ] Add CSS 3D scene, table discs, seat orbits, responsive grid, and dark admin theme integration.
- [ ] Add JS click/focus handlers that update the detail panel.
- [ ] Preserve keyboard access through real `<button>` elements.

### Task 5: Verification

**Files:**
- Test: `site.test.mjs`

- [ ] Run `npm test`.
- [ ] Run `/usr/local/share/dotnet/x64/dotnet build`.
- [ ] Smoke test `/admin/login`, login POST, and `/Admin/Seating`.

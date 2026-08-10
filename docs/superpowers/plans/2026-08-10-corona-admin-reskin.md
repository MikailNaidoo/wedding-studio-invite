# Corona Admin Reskin Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Reskin the admin-only dashboard and login pages using a Corona Free-inspired Bootstrap 5 dark dashboard layout.

**Architecture:** Public wedding pages remain unchanged. Admin Razor pages keep existing handlers and data flow, while markup/CSS/JS adopt Bootstrap dashboard conventions: sidebar, navbar, dark cards, responsive table, Bootstrap modals, and toast notifications.

**Tech Stack:** ASP.NET Core Razor Pages, Bootstrap 5 CDN, Material Design Icons CDN, existing vanilla JavaScript, existing PostgreSQL backend.

## Global Constraints

- Apply the template direction to the admin section only.
- Do not copy paid/protected template source files directly.
- Keep BootstrapDash attribution in the admin footer for free-template compliance.
- Preserve existing RSVP CRUD, dashboard metrics, inline status updates, CSV export, login, and toast behavior.

---

### Task 1: Test Corona-Style Admin Contract

**Files:**
- Modify: `site.test.mjs`

**Interfaces:**
- Produces tests that require Bootstrap CDN, Material Design Icons, Corona-themed layout classes, sidebar/nav structure, attribution, and public-page isolation.

- [x] Add failing tests for Bootstrap/Corona admin assets and layout.
- [x] Run `npm test` and verify the new test fails.

### Task 2: Admin Markup Reskin

**Files:**
- Modify: `Pages/Admin/Index.cshtml`
- Modify: `Pages/Admin/Login.cshtml`

**Interfaces:**
- Consumes existing page models and forms.
- Produces Corona-inspired sidebar, navbar, cards, Bootstrap table, Bootstrap modals, Bootstrap toasts, and footer attribution.

- [ ] Add Bootstrap and MDI assets to admin pages.
- [ ] Convert dashboard shell to sidebar/content layout.
- [ ] Convert metrics to Bootstrap dark cards.
- [ ] Convert table, modals, buttons, forms, and login panel to Bootstrap-compatible markup.
- [ ] Keep all form names/handlers unchanged.

### Task 3: CSS And JS Alignment

**Files:**
- Modify: `wwwroot/css/admin.css`
- Modify: `wwwroot/js/admin.js`

**Interfaces:**
- Consumes Bootstrap markup and existing data attributes.
- Produces Corona-like dark visual styling and Bootstrap-compatible modal/toast behavior.

- [ ] Replace custom modal visibility logic with Bootstrap modal API when available.
- [ ] Keep fallback modal behavior if Bootstrap JS is unavailable.
- [ ] Style sidebar, cards, table, login page, footer, and toasts.

### Task 4: Verification

**Files:**
- No production files.

**Interfaces:**
- Validates with `npm test`, `dotnet build`, and authenticated local render smoke test.

- [ ] Run tests.
- [ ] Build .NET app.
- [ ] Restart local app.
- [ ] Verify `/Admin` renders Corona-style markers after login.

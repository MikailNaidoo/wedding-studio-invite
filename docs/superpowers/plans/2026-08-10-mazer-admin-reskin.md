# Mazer Admin Reskin Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Replace the Corona admin UI with the local Mazer admin dashboard theme while keeping all RSVP admin behavior intact.

**Architecture:** The public wedding page remains independent. The admin pages load Mazer assets from `wwwroot/vendor/mazer` and keep the existing Razor handlers, form names, modal data attributes, inline status updates, and toast hooks.

**Tech Stack:** ASP.NET Core Razor Pages, Bootstrap 5, Mazer 1.0.0 local assets, Bootstrap Icons, plain JavaScript.

## Global Constraints

- Use Mazer only for the admin section.
- Do not add Mazer assets to `Pages/Index.cshtml`.
- Preserve admin CRUD, inline status updates, toasts, export, and logout.
- Use local assets from `/Users/mikailnaidoo/Downloads/mazer-1.0.0/dist`.
- Keep the Mazer MIT license notice available in copied assets.

---

### Task 1: Template Contract

**Files:**
- Modify: `site.test.mjs`

**Interfaces:**
- Consumes: existing file-read helper.
- Produces: failing test coverage for Mazer admin shell markers.

- [ ] Change the admin template test to assert Mazer CSS, Bootstrap Icons, `#app`, `#sidebar`, `.sidebar-wrapper`, `.page-heading`, `.section`, Mazer login `#auth`, and no public page leak.
- [ ] Run `npm test` and verify the Mazer test fails against the current Corona markup.

### Task 2: Local Mazer Assets

**Files:**
- Create: `wwwroot/vendor/mazer/assets/...`
- Create: `wwwroot/vendor/mazer/LICENSE`

**Interfaces:**
- Produces static files loaded by admin pages through `/vendor/mazer/assets/...`.

- [ ] Copy `dist/assets/css`, `dist/assets/js`, `dist/assets/vendors/bootstrap-icons`, `dist/assets/vendors/perfect-scrollbar`, `dist/assets/vendors/toastify`, `dist/assets/vendors/iconly`, `dist/assets/images/logo`, and `LICENSE`.

### Task 3: Admin Razor Markup

**Files:**
- Modify: `Pages/Admin/Index.cshtml`
- Modify: `Pages/Admin/Login.cshtml`

**Interfaces:**
- Consumes: `IndexModel` stats, submissions, handlers, and toast properties.
- Produces: Mazer dashboard and login pages with unchanged form binding.

- [ ] Replace Corona CDN links with Mazer local CSS and scripts.
- [ ] Replace the dashboard shell with `#app`, `#sidebar`, `.sidebar-wrapper`, `.page-heading`, `.section`, Mazer cards, table, modals, and footer.
- [ ] Replace login with Mazer `#auth` layout and existing username/password bindings.

### Task 4: Admin CSS and JS

**Files:**
- Modify: `wwwroot/css/admin.css`
- Modify: `wwwroot/js/admin.js`

**Interfaces:**
- Consumes: Mazer DOM and existing `data-*` attributes.
- Produces: wedding-branded Mazer overrides, sidebar toggling, Bootstrap modal/toast behavior.

- [ ] Replace Corona-specific overrides with Mazer-compatible admin theme overrides.
- [ ] Update sidebar toggle logic to use Mazer `#sidebar.active` and `.sidebar-wrapper.active`.
- [ ] Keep Bootstrap modal/toast fallback behavior.

### Task 5: Verification

**Files:**
- Test: `site.test.mjs`

- [ ] Run `npm test`.
- [ ] Run `/usr/local/share/dotnet/x64/dotnet build`.
- [ ] Smoke test `/admin/login`, login POST, `/Admin`, and public `/` on `localhost:5147`.

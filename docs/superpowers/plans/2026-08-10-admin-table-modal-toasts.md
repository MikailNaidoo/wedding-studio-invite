# Admin Table Modal Toasts Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Replace the admin guest-card list with a table, themed modal CRUD actions, and toast notifications.

**Architecture:** Keep Razor Pages server-rendered handlers and add client-side modal/toast behavior in `wwwroot/js/admin.js`. Use `TempData` for post-redirect completion toasts and data attributes for modal population.

**Tech Stack:** ASP.NET Core Razor Pages, existing dark admin CSS, vanilla JavaScript.

## Global Constraints

- Guest list index must be a table.
- No editing inline.
- Edit must be a separate modal pop-up.
- Delete confirmation must use the same website theme instead of browser confirm.
- Add toastr-style notifications for key function completion.

---

### Task 1: Test The New Admin UI Contract

**Files:**
- Modify: `site.test.mjs`

**Interfaces:**
- Produces test assertions for `.guest-table`, `data-edit-modal`, `data-delete-modal`, `data-toast-region`, `showToast`, and TempData messages.

- [x] Add failing tests for table/modal/toast admin dashboard behavior.
- [x] Run `npm test` and verify the new test fails against the card/inline-edit UI.

### Task 2: Server Markup And TempData

**Files:**
- Modify: `Pages/Admin/Index.cshtml`
- Modify: `Pages/Admin/Index.cshtml.cs`

**Interfaces:**
- Consumes existing `OnPostCreateAsync`, `OnPostUpdateAsync`, `OnPostDeleteAsync`, `OnPostStatusAsync`.
- Produces `ToastMessage` and `ToastTone` TempData.

- [ ] Replace submission cards with a guest table.
- [ ] Add `New RSVP`, edit, and delete modals.
- [ ] Add row data attributes for edit modal population.
- [ ] Set TempData toast messages after create, update, delete, and export failure.

### Task 3: Client Interaction

**Files:**
- Modify: `wwwroot/js/admin.js`

**Interfaces:**
- Consumes data attributes from admin table rows and modal controls.
- Produces `showToast(message, tone)`, modal open/close, edit population, themed delete confirmation, status save feedback.

- [ ] Add modal open/close behavior.
- [ ] Populate the edit form from row data attributes.
- [ ] Populate delete modal action and guest name.
- [ ] Show toast notifications for saved status and server TempData messages.

### Task 4: Styling And Verification

**Files:**
- Modify: `wwwroot/css/admin.css`

**Interfaces:**
- Produces table, modal, toast, and responsive mobile styles.

- [ ] Add polished dark table styling.
- [ ] Add modal and toast styles matching the wedding admin theme.
- [ ] Run `npm test` and `dotnet build`.

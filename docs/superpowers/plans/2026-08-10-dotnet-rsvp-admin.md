# .NET RSVP Admin Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Convert the wedding invite into an ASP.NET Core single-page RSVP app with PostgreSQL persistence, spam protection, and an admin dashboard.

**Architecture:** Keep the romantic public page as Razor Pages content while adding a small server-side data layer using Npgsql. Admin pages use cookie authentication, server-rendered CRUD, and a tiny JavaScript endpoint for inline status updates.

**Tech Stack:** ASP.NET Core Razor Pages, Npgsql, PostgreSQL, cookie authentication, existing HTML/CSS/JS assets.

## Global Constraints

- Couple: Mikail Naidoo and Dershia Nadesan.
- Wedding date: 29 August 2027.
- Arrival time: 10:00.
- Venue: The Bell Inn, 208 Kenneth Kaunda Road, Durban North, 4051.
- Public RSVP form must not include an email input.
- RSVP submissions must include spam protection.
- Admin dashboard must use a dark theme and include CRUD plus inline Pending/Confirmed status updates.

---

### Task 1: Server App Shell

**Files:**
- Create: `WeddingStudioInvite.csproj`
- Create: `Program.cs`
- Create: `appsettings.json`
- Create: `Properties/launchSettings.json`

**Interfaces:**
- Produces `IWeddingRepository` registration and cookie auth for Razor Pages.

- [x] Write failing tests in `site.test.mjs` for .NET project files, public form fields, spam protection, admin dashboard, and config.
- [x] Run `npm test` and confirm it fails because the server app does not exist.
- [ ] Add the ASP.NET Core project shell and configuration.
- [ ] Run `dotnet build`.

### Task 2: RSVP Persistence And Spam Protection

**Files:**
- Create: `Models/RsvpSubmission.cs`
- Create: `Models/RsvpInput.cs`
- Create: `Services/RsvpSpamGuard.cs`
- Create: `Data/WeddingRepository.cs`
- Create: `Data/DatabaseSettings.cs`

**Interfaces:**
- Produces `RsvpSpamGuard.Validate(RsvpInput input, DateTimeOffset now)`.
- Produces `WeddingRepository` methods for create, update, delete, status update, dashboard stats, search, and CSV export.

- [ ] Implement raw SQL table creation and repository methods using Npgsql.
- [ ] Add server spam checks: honeypot, minimum elapsed time, required name, guest count bounds, repeated URLs.
- [ ] Run `npm test` and `dotnet build`.

### Task 3: Public RSVP Page

**Files:**
- Create: `Pages/Index.cshtml`
- Create: `Pages/Index.cshtml.cs`
- Modify: `app.js`

**Interfaces:**
- Consumes `IWeddingRepository.CreateAsync` and `RsvpSpamGuard.Validate`.

- [ ] Port the public invite markup into Razor Pages.
- [ ] Remove the email field and prototype text.
- [ ] Add hidden spam timing and honeypot fields.
- [ ] Save RSVP submissions to PostgreSQL.
- [ ] Run `npm test` and `dotnet build`.

### Task 4: Admin Dashboard

**Files:**
- Create: `Pages/Admin/Login.cshtml`
- Create: `Pages/Admin/Login.cshtml.cs`
- Create: `Pages/Admin/Index.cshtml`
- Create: `Pages/Admin/Index.cshtml.cs`
- Create: `wwwroot/css/admin.css`
- Create: `wwwroot/js/admin.js`

**Interfaces:**
- Consumes repository CRUD and stats methods.

- [ ] Add admin login/logout with `ADMIN_USERNAME` and `ADMIN_PASSWORD`.
- [ ] Add dark dashboard tiles for submissions, attending, not attending, pending, confirmed, dietary notes, and recent submissions.
- [ ] Add search/filter, create, edit, delete, CSV export, admin notes, duplicate warnings, and inline status updates.
- [ ] Run `npm test` and `dotnet build`.

### Task 5: Deployment Notes

**Files:**
- Create or modify: `README.md`

**Interfaces:**
- Documents Azure App Service settings and PostgreSQL connection configuration.

- [ ] Document required environment variables and connection string setup.
- [ ] Run final verification.

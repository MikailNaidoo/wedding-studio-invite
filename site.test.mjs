import test from "node:test";
import assert from "node:assert/strict";
import { existsSync, readFileSync } from "node:fs";

const read = (path) => readFileSync(new URL(path, import.meta.url), "utf8");

test("defines an ASP.NET Core Razor Pages app with PostgreSQL persistence", () => {
  assert.equal(existsSync(new URL("./WeddingStudioInvite.csproj", import.meta.url)), true);
  assert.equal(existsSync(new URL("./Program.cs", import.meta.url)), true);
  assert.equal(existsSync(new URL("./Data/WeddingRepository.cs", import.meta.url)), true);

  const project = read("./WeddingStudioInvite.csproj");
  const program = read("./Program.cs");
  const repository = read("./Data/WeddingRepository.cs");
  const databaseSettings = read("./Data/DatabaseSettings.cs");
  const login = read("./Pages/Admin/Login.cshtml.cs");

  assert.match(project, /Microsoft\.NET\.Sdk\.Web/);
  assert.match(project, /<TargetFramework>net8\.0<\/TargetFramework>/);
  assert.match(project, /Npgsql/);
  assert.match(program, /MapRazorPages/);
  assert.match(program, /AddAuthentication/);
  assert.match(login, /ADMIN_USERNAME/);
  assert.match(login, /ADMIN_PASSWORD/);
  assert.match(repository, /CREATE TABLE IF NOT EXISTS rsvp_submissions/);
  assert.match(databaseSettings, /DATABASE_URL/);
});

test("public RSVP page removes email and saves guest responses", () => {
  assert.equal(existsSync(new URL("./Pages/Index.cshtml", import.meta.url)), true);
  assert.equal(existsSync(new URL("./Pages/Index.cshtml.cs", import.meta.url)), true);

  const page = read("./Pages/Index.cshtml");
  const model = read("./Pages/Index.cshtml.cs");

  assert.match(page, /Mikail Naidoo/);
  assert.match(page, /Dershia Nadesan/);
  assert.match(page, /29 August 2027/);
  assert.match(page, /10:00/);
  assert.match(page, /The Bell Inn/);
  assert.match(page, /208 Kenneth Kaunda Road/);
  assert.match(page, /name="Input\.FullName"/);
  assert.match(page, /name="Input\.GuestCount"/);
  assert.match(page, /name="Input\.DietaryNotes"/);
  assert.match(page, /name="Input\.GuestMessage"/);
  assert.match(page, /name="Input\.Website"/);
  assert.match(page, /name="Input\.StartedAtTicks"/);
  assert.doesNotMatch(page, /type="email"/);
  assert.doesNotMatch(page, /name="email"/);
  assert.match(model, /CreateAsync/);
  assert.match(model, /RsvpSpamGuard/);
});

test("server-side spam protection guards RSVP submissions", () => {
  assert.equal(existsSync(new URL("./Services/RsvpSpamGuard.cs", import.meta.url)), true);
  const guard = read("./Services/RsvpSpamGuard.cs");
  const input = read("./Models/RsvpInput.cs");

  assert.match(input, /Website/);
  assert.match(input, /StartedAtTicks/);
  assert.match(input, /string\? DietaryNotes/);
  assert.match(input, /string\? GuestMessage/);
  assert.match(input, /string\? Website/);
  assert.match(guard, /honeypot/i);
  assert.match(guard, /MinimumSubmissionAge/);
  assert.match(guard, /https\?:\\\/\\\//);
  assert.match(guard, /GuestCount/);
});

test("admin dashboard includes CRUD, inline status updates, and Mazer metrics", () => {
  assert.equal(existsSync(new URL("./Pages/Admin/Login.cshtml", import.meta.url)), true);
  assert.equal(existsSync(new URL("./Pages/Admin/Index.cshtml", import.meta.url)), true);
  assert.equal(existsSync(new URL("./wwwroot/css/admin.css", import.meta.url)), true);
  assert.equal(existsSync(new URL("./wwwroot/js/admin.js", import.meta.url)), true);

  const dashboard = read("./Pages/Admin/Index.cshtml");
  const dashboardModel = read("./Pages/Admin/Index.cshtml.cs");
  const css = read("./wwwroot/css/admin.css");
  const js = read("./wwwroot/js/admin.js");

  assert.match(dashboard, /Total submissions/);
  assert.match(dashboard, /People attending/);
  assert.match(dashboard, /People not attending/);
  assert.match(dashboard, /Pending/);
  assert.match(dashboard, /Confirmed/);
  assert.match(dashboard, /Dietary notes/);
  assert.match(dashboard, /Last 7 days/);
  assert.match(dashboard, /name="Search"/);
  assert.match(dashboard, /name="Filter"/);
  assert.match(dashboard, /asp-page-handler="Create"/);
  assert.match(dashboard, /asp-page-handler="Update"/);
  assert.match(dashboard, /asp-page-handler="Delete"/);
  assert.match(dashboard, /data-status-select/);
  assert.match(dashboard, /Export CSV/);
  assert.match(dashboardModel, /OnPostStatusAsync/);
  assert.match(dashboardModel, /OnGetExportAsync/);
  assert.match(css, /--admin-bg:\s*#0f1220/);
  assert.match(js, /fetch/);
  assert.match(js, /RequestVerificationToken/);
});

test("admin guest list uses a table with modal crud and toast notifications", () => {
  const dashboard = read("./Pages/Admin/Index.cshtml");
  const dashboardModel = read("./Pages/Admin/Index.cshtml.cs");
  const css = read("./wwwroot/css/admin.css");
  const js = read("./wwwroot/js/admin.js");

  assert.match(dashboard, /guest-table/);
  assert.match(dashboard, /<table[\s\S]*class="[^"]*guest-table[^"]*"/);
  const guestTable = dashboard.match(/<table class="guest-table[\s\S]*?<\/table>/)?.[0] || "";
  assert.doesNotMatch(guestTable, /Admin notes/);
  assert.match(dashboard, /data-edit-modal/);
  assert.match(dashboard, /data-delete-modal/);
  assert.match(dashboard, /data-toast-region/);
  assert.match(dashboard, /data-edit-button/);
  assert.match(dashboard, /data-delete-button/);
  assert.match(dashboard, /data-new-rsvp-button/);
  assert.doesNotMatch(dashboard, /class="submission-card"/);
  assert.doesNotMatch(dashboard, /onclick="return confirm/);
  assert.match(dashboardModel, /ToastMessage/);
  assert.match(dashboardModel, /ToastTone/);
  assert.match(js, /showToast/);
  assert.match(js, /openModal/);
  assert.match(js, /data-edit-button/);
  assert.match(js, /data-delete-button/);
  assert.match(css, /\.guest-table/);
  assert.match(css, /\.modal-backdrop/);
  assert.match(css, /\.toast-region/);
});

test("admin section uses the local Mazer template without touching the public page", () => {
  const dashboard = read("./Pages/Admin/Index.cshtml");
  const login = read("./Pages/Admin/Login.cshtml");
  const publicPage = read("./Pages/Index.cshtml");
  const css = read("./wwwroot/css/admin.css");
  const js = read("./wwwroot/js/admin.js");

  assert.match(dashboard, /\/vendor\/mazer\/assets\/css\/bootstrap\.css/);
  assert.match(dashboard, /\/vendor\/mazer\/assets\/css\/app\.css/);
  assert.match(dashboard, /\/vendor\/mazer\/assets\/vendors\/bootstrap-icons\/bootstrap-icons\.css/);
  assert.match(dashboard, /id="app"/);
  assert.match(dashboard, /id="sidebar"/);
  assert.match(dashboard, /sidebar-wrapper/);
  const sidebar = dashboard.match(/<aside id="sidebar"[\s\S]*?<\/aside>/)?.[0] || "";
  assert.doesNotMatch(sidebar, /<li class="sidebar-title">Details<\/li>/);
  assert.doesNotMatch(sidebar, /29 Aug 2027/);
  assert.doesNotMatch(sidebar, /The Bell Inn/);
  assert.match(dashboard, /page-heading/);
  assert.match(dashboard, /class="section/);
  assert.match(dashboard, /data-bs-toggle/);
  assert.match(dashboard, /\/vendor\/mazer\/assets\/js\/main\.js/);
  assert.match(login, /\/vendor\/mazer\/assets\/css\/pages\/auth\.css/);
  assert.match(login, /id="auth"/);
  assert.match(login, /auth-left/);
  assert.match(login, /auth-right/);
  assert.match(login, /Mazer/);
  assert.doesNotMatch(dashboard, /powered by local Mazer assets/i);
  assert.match(css, /\.mazer-admin-shell/);
  assert.match(css, /\.mazer-login/);
  assert.match(css, /--wedding-gold/);
  assert.match(js, /sidebar-wrapper/);
  assert.match(js, /bootstrap\.Modal/);
  assert.doesNotMatch(publicPage, /\/vendor\/mazer/);
  assert.doesNotMatch(publicPage, /mazer-admin-shell/);
});

test("keeps the generated South Indian wedding artwork and mobile hero framing", () => {
  const page = read("./Pages/Index.cshtml");
  const css = read("./styles.css");
  const manifest = JSON.parse(read("./assets/image-manifest.json"));

  [
    "wedding-hero.png",
    "wedding-card-detail.png",
    "mikail-portrait.png",
    "dershia-portrait.png",
    "wedding-mandap.png",
    "gallery-couple.png",
    "gallery-details.png",
    "gallery-celebration.png",
  ].forEach((asset) => {
    assert.equal(existsSync(new URL(`./assets/${asset}`, import.meta.url)), true);
    assert.match(page, new RegExp(`/assets/${asset}`));
    assert.equal(typeof manifest[asset], "string");
  });

  assert.match(page, /grey double-breasted suit with a tie, mustache, and goatee/);
  assert.match(page, /cream and gold bridal attire/);
  assert.match(css, /@media \(max-width: 540px\)[\s\S]*\.hero-slide-couple img\s*\{[\s\S]*object-position:\s*78% center;/);
});

test("serves browser touch icons to avoid static asset 404 noise", () => {
  const page = read("./Pages/Index.cshtml");

  assert.equal(existsSync(new URL("./apple-touch-icon.png", import.meta.url)), true);
  assert.match(page, /rel="apple-touch-icon"/);
  assert.match(page, /href="\/apple-touch-icon\.png"/);
  assert.match(page, /rel="icon"/);
});

test("documents and handles local PostgreSQL being unavailable", () => {
  assert.equal(existsSync(new URL("./docker-compose.yml", import.meta.url)), true);
  assert.equal(existsSync(new URL("./Data/DatabaseUnavailableException.cs", import.meta.url)), true);

  const compose = read("./docker-compose.yml");
  const repository = read("./Data/WeddingRepository.cs");
  const publicPage = read("./Pages/Index.cshtml.cs");
  const adminPage = read("./Pages/Admin/Index.cshtml.cs");
  const readme = read("./README.md");

  assert.match(compose, /postgres:16-alpine/);
  assert.match(compose, /5432:5432/);
  assert.match(compose, /wedding_rsvp/);
  assert.match(repository, /DatabaseUnavailableException/);
  assert.match(repository, /OpenConnectionAsync/);
  assert.match(publicPage, /DatabaseUnavailableException/);
  assert.match(adminPage, /DatabaseUnavailableException/);
  assert.match(readme, /docker compose up -d/);
  assert.match(readme, /Connection refused/);
});

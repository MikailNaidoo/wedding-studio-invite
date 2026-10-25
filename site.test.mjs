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

test("uses the uploaded clip for the hero and the original clip for Drakensberg", () => {
  const page = read("./index.html");
  const app = read("./app.js");

  assert.equal(existsSync(new URL("./assets/hero-video-new.mp4", import.meta.url)), true);
  assert.equal(existsSync(new URL("./assets/hero-video.mp4", import.meta.url)), true);
  assert.match(page, /<video id="intro-video"[^>]*><source src="assets\/hero-video-new\.mp4" type="video\/mp4">/);
  assert.match(app, /\{name:'Drakensberg',[^}]*video:'assets\/hero-video\.mp4'/);
  assert.match(app, /if\(city\.video\)\{[\s\S]*?video\.src=city\.video/);
});

test("plays the reference message transition when navigating to Journey or Wedding", () => {
  const page = read("./index.html");
  const razorPage = read("./Pages/Index.cshtml");
  const app = read("./app.js");

  assert.match(page, /<script defer src="app\.js\?v=3"><\/script>/);
  assert.match(razorPage, /<script defer src="app\.js\?v=3"><\/script>/);
  assert.match(app, /button\.addEventListener\('click',\(\)=>setView\(button\.dataset\.viewLink,button\.dataset\.viewLink!=='intro'\)\)/);
  assert.match(app, /Spin the globe to find our hidden moments\. Select a city to start\./);
  assert.match(app, /And now, Our new adventure begins\./);
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
  assert.match(js, /bootstrap\.Modal/);
  assert.doesNotMatch(publicPage, /\/vendor\/mazer/);
  assert.doesNotMatch(publicPage, /mazer-admin-shell/);
});

test("admin mobile sidebar relies on a single Mazer toggle path", () => {
  const css = read("./wwwroot/css/admin.css");
  const js = read("./wwwroot/js/admin.js");

  assert.doesNotMatch(js, /querySelectorAll\("\[data-sidebar-toggle\]"\)/);
  assert.match(css, /#sidebar\.active\s+\.sidebar-wrapper/);
  assert.match(css, /z-index:\s*1050/);
  assert.match(css, /max-width:\s*min\(300px,\s*86vw\)/);
});

test("admin seating plan renders an accessible 150 guest layout", () => {
  assert.equal(existsSync(new URL("./Pages/Admin/Seating.cshtml", import.meta.url)), true);
  assert.equal(existsSync(new URL("./Pages/Admin/Seating.cshtml.cs", import.meta.url)), true);
  assert.equal(existsSync(new URL("./wwwroot/css/seating.css", import.meta.url)), true);
  assert.equal(existsSync(new URL("./wwwroot/js/seating.js", import.meta.url)), true);

  const dashboard = read("./Pages/Admin/Index.cshtml");
  const seating = read("./Pages/Admin/Seating.cshtml");
  const seatingModel = read("./Pages/Admin/Seating.cshtml.cs");
  const css = read("./wwwroot/css/seating.css");
  const js = read("./wwwroot/js/seating.js");

  assert.match(dashboard, /\/Admin\/Seating/);
  assert.match(seating, /\/Admin\/Seating/);
  assert.match(seating, /Seating Plan/);
  assert.match(seating, /data-seating-stage/);
  assert.match(seating, /data-seat-button/);
  assert.match(seating, /data-seat-detail/);
  assert.match(seating, /seating-accessible-table/);
  assert.match(seating, /aria-label/);
  assert.match(seating, /\/css\/seating\.css/);
  assert.match(seating, /\/js\/seating\.js/);
  assert.match(seatingModel, /\[Authorize\]/);
  assert.match(seatingModel, /TableCount\s*=\s*15/);
  assert.match(seatingModel, /SeatsPerTable\s*=\s*10/);
  assert.match(seatingModel, /ListAttendingGuestsAsync/);
  assert.doesNotMatch(seatingModel, /Guest 150/);
  assert.match(css, /\.seating-floor-plan/);
  assert.match(css, /\.floor-seat/);
  assert.match(js, /data-seat-button/);
  assert.match(js, /data-seat-detail/);
  assert.match(js, /focus/);
});

test("admin seating plan uses a responsive floor-plan layout", () => {
  const seating = read("./Pages/Admin/Seating.cshtml");
  const css = read("./wwwroot/css/seating.css");
  const js = read("./wwwroot/js/seating.js");

  assert.match(seating, /seating-floor-plan/);
  assert.match(seating, /floor-plan-scroll/);
  assert.match(seating, /dance-floor/);
  assert.match(seating, /Dance Floor/);
  assert.match(seating, /head-table/);
  assert.match(seating, /Head Table/);
  assert.match(seating, /floor-table/);
  assert.match(seating, /floor-seat/);
  assert.doesNotMatch(seating, /class="[^"]*seating-stage/);
  assert.doesNotMatch(seating, /class="table-grid"/);
  assert.doesNotMatch(seating, /class="seat-table/);
  assert.doesNotMatch(seating, /class="seat-orbit/);
  assert.match(css, /linear-gradient\(rgba\(17,\s*24,\s*39,\s*0\.06\) 1px,\s*transparent 1px\)/);
  assert.match(css, /\.seating-floor-plan/);
  assert.match(css, /\.floor-table/);
  assert.match(css, /border:\s*2px solid #1f2937/);
  assert.match(css, /\.floor-seat/);
  assert.match(css, /border-radius:\s*50%/);
  assert.match(css, /\.dance-floor/);
  assert.match(css, /\.head-table/);
  assert.match(css, /\.floor-plan-scroll\s*\{[\s\S]*background:\s*var\(--floor-paper\)/);
  assert.match(css, /\.seating-card\s+\.card-body\s*\{[\s\S]*background:\s*var\(--floor-paper\)/);
  assert.match(css, /box-shadow:\s*none/);
  assert.doesNotMatch(css, /\.seat-orbit/);
  assert.match(css, /overflow-x:\s*auto/);
  assert.match(css, /min-width:\s*1320px/);
  assert.match(css, /@media \(max-width: 767px\)/);
  assert.match(js, /floor-seat/);
});

test("admin seating plan reads attending guests and saves draggable table layout", () => {
  const repositoryInterface = read("./Data/IWeddingRepository.cs");
  const repository = read("./Data/WeddingRepository.cs");
  const seating = read("./Pages/Admin/Seating.cshtml");
  const seatingModel = read("./Pages/Admin/Seating.cshtml.cs");
  const css = read("./wwwroot/css/seating.css");
  const js = read("./wwwroot/js/seating.js");

  assert.match(repositoryInterface, /ListAttendingGuestsAsync/);
  assert.match(repositoryInterface, /ListSeatingLayoutAsync/);
  assert.match(repositoryInterface, /SaveSeatingLayoutAsync/);
  assert.match(repository, /CREATE TABLE IF NOT EXISTS seating_layout/);
  assert.match(repository, /WHERE attending = TRUE/);
  assert.match(repository, /ORDER BY LOWER\(full_name\), id/);
  assert.match(seatingModel, /OnPostLayoutAsync/);
  assert.match(seatingModel, /JsonResult/);
  assert.match(seatingModel, /SaveSeatingLayoutAsync/);
  assert.match(seating, /data-layout-url/);
  assert.match(seating, /data-floor-table/);
  assert.match(seating, /data-guest="@seat\.GuestName"/);
  assert.match(seating, /@seat\.GuestName/);
  assert.match(css, /cursor:\s*grab/);
  assert.match(css, /\.floor-table\.is-dragging/);
  assert.match(js, /pointerdown/);
  assert.match(js, /pointermove/);
  assert.match(js, /pointerup/);
  assert.match(js, /pointercancel/);
  assert.match(js, /lostpointercapture/);
  assert.match(js, /getTablePosition/);
  assert.match(js, /getBoundingClientRect/);
  assert.match(js, /fetch\(layoutUrl/);
  assert.match(js, /RequestVerificationToken/);
  assert.doesNotMatch(js, /table\.style\.left \|\| "0"/);
  assert.doesNotMatch(seating, /Guest \d\{3\}/);
});

test("admin seating plan saves guest assignments to specific table seats", () => {
  assert.equal(existsSync(new URL("./Models/SeatingAssignment.cs", import.meta.url)), true);

  const repositoryInterface = read("./Data/IWeddingRepository.cs");
  const repository = read("./Data/WeddingRepository.cs");
  const seating = read("./Pages/Admin/Seating.cshtml");
  const seatingModel = read("./Pages/Admin/Seating.cshtml.cs");

  assert.match(repositoryInterface, /ListSeatingAssignmentsAsync/);
  assert.match(repositoryInterface, /SaveSeatingAssignmentAsync/);
  assert.match(repositoryInterface, /ClearSeatingAssignmentAsync/);
  assert.match(repository, /CREATE TABLE IF NOT EXISTS guest_seating_assignments/);
  assert.match(repository, /rsvp_submission_id BIGINT NOT NULL UNIQUE/);
  assert.match(repository, /UNIQUE \(table_number, seat_number\)/);
  assert.match(repository, /JOIN rsvp_submissions/);
  assert.match(repository, /attending = TRUE/);
  assert.match(seatingModel, /SeatingAssignment/);
  assert.match(seatingModel, /OnPostAssignAsync/);
  assert.match(seatingModel, /OnPostClearAssignmentAsync/);
  assert.match(seatingModel, /UnassignedGuests/);
  assert.match(seating, /asp-page-handler="Assign"/);
  assert.match(seating, /asp-page-handler="ClearAssignment"/);
  assert.match(seating, /name="Assignment\.RsvpSubmissionId"/);
  assert.match(seating, /name="Assignment\.TableNumber"/);
  assert.match(seating, /name="Assignment\.SeatNumber"/);
  assert.match(seating, /Unassigned guests/);
  assert.match(seating, /@seat\.RsvpSubmissionId/);
  assert.match(seating, /data-rsvp-id="@seat\.RsvpSubmissionId"/);
});

test("admin seating accessible list only shows tables with assigned guests", () => {
  const seating = read("./Pages/Admin/Seating.cshtml");
  const seatingModel = read("./Pages/Admin/Seating.cshtml.cs");

  assert.match(seatingModel, /AssignedTables/);
  assert.match(seating, /Model\.AssignedTables/);
  assert.match(seating, /@if \(Model\.AssignedTables\.Count > 0\)/);

  const accessibleSection = seating.match(/<section class="section seating-accessible-table"[\s\S]*?<\/section>/)?.[0] || "";
  assert.match(accessibleSection, /Model\.AssignedTables/);
  assert.match(accessibleSection, /table\.AssignedSeats/);
  assert.doesNotMatch(accessibleSection, /Model\.Tables/);
  assert.doesNotMatch(accessibleSection, /Open seat/);
  assert.doesNotMatch(accessibleSection, /No guests have been assigned/);
});

test("admin seating floor map only renders assigned tables and guest names", () => {
  const seating = read("./Pages/Admin/Seating.cshtml");

  const floorMap = seating.match(/<div class="floor-table-grid">[\s\S]*?<\/div>\s*<\/div>\s*<\/div>/)?.[0] || "";
  assert.match(floorMap, /Model\.VisualizedTables/);
  assert.match(floorMap, /table\.Seats/);
  assert.doesNotMatch(floorMap, /Model\.Tables/);
  assert.doesNotMatch(floorMap, /table\.AssignedSeats/);
  assert.match(floorMap, /@seat\.GuestName/);
  assert.match(seating, /No tables created yet/);
});

test("admin seating plan can create empty visualized tables before guests are assigned", () => {
  assert.equal(existsSync(new URL("./Models/CreatedSeatingTable.cs", import.meta.url)), true);

  const repositoryInterface = read("./Data/IWeddingRepository.cs");
  const repository = read("./Data/WeddingRepository.cs");
  const seating = read("./Pages/Admin/Seating.cshtml");
  const seatingModel = read("./Pages/Admin/Seating.cshtml.cs");

  assert.match(repositoryInterface, /ListCreatedSeatingTablesAsync/);
  assert.match(repositoryInterface, /CreateSeatingTableAsync/);
  assert.match(repository, /CREATE TABLE IF NOT EXISTS created_seating_tables/);
  assert.match(repository, /INSERT INTO created_seating_tables/);
  assert.match(repository, /ON CONFLICT \(table_number\)/);
  assert.match(seatingModel, /CreatedTables/);
  assert.match(seatingModel, /VisualizedTables/);
  assert.match(seatingModel, /OnPostCreateTableAsync/);
  assert.match(seatingModel, /ListCreatedSeatingTablesAsync/);
  assert.match(seatingModel, /CreateSeatingTableAsync/);
  assert.match(seating, /asp-page-handler="CreateTable"/);
  assert.match(seating, /name="NewTableNumber"/);
  assert.match(seating, /Create table/);
  assert.match(seating, /Model\.VisualizedTables/);
  assert.match(seating, /@table\.AssignedSeatCount seated/);
});

test("admin seating plan renders saved table coordinates with invariant css decimals", () => {
  const seating = read("./Pages/Admin/Seating.cshtml");

  assert.match(seating, /ToString\("0\.###", CultureInfo\.InvariantCulture\)/);
  assert.match(seating, /left: \{savedPosition\.XPercent\.ToString/);
  assert.match(seating, /top: \{savedPosition\.YPercent\.ToString/);
});

test("admin seating can export assigned tables as a printable PDF", () => {
  const seating = read("./Pages/Admin/Seating.cshtml");
  const seatingModel = read("./Pages/Admin/Seating.cshtml.cs");

  assert.match(seatingModel, /OnGetExportPdfAsync/);
  assert.match(seatingModel, /BuildSeatingPlanPdf/);
  assert.match(seatingModel, /File\(pdf/);
  assert.match(seatingModel, /application\/pdf/);
  assert.match(seatingModel, /Mikail & Dershia Wedding Seating Plan\.pdf/);
  assert.match(seatingModel, /29\.08\.2027/);
  assert.match(seatingModel, /MIKAIL & DERSHIA WEDDING/);
  assert.match(seatingModel, /SEATING PLAN/);
  assert.match(seatingModel, /AssignedTables/);
  const pdfBuilder = seatingModel.match(/private static byte\[\] BuildSeatingPlanPdf[\s\S]*?return writer\.Build\(\);/)?.[0] || "";
  assert.match(pdfBuilder, /AssignedSeats/);
  assert.doesNotMatch(pdfBuilder, /Open seat/);
  assert.match(seating, /\?handler=ExportPdf/);
  assert.match(seating, /Export PDF/);
});

test("admin seating plan keeps desktop tables fully visible", () => {
  const css = read("./wwwroot/css/seating.css");

  assert.match(css, /\.seating-workspace\s*\{[\s\S]*grid-template-columns:\s*1fr/);
  assert.doesNotMatch(css, /grid-template-columns:\s*minmax\(0,\s*1fr\)\s+270px/);
  assert.match(css, /\.floor-plan-scroll\s*\{[\s\S]*overflow-x:\s*auto/);
  assert.match(css, /\.floor-plan-scroll\s*\{[\s\S]*overflow-y:\s*auto/);
  assert.match(css, /\.seating-floor-plan\s*\{[\s\S]*width:\s*100%/);
  assert.match(css, /\.seating-floor-plan\s*\{[\s\S]*min-width:\s*1320px/);
  assert.match(css, /\.seating-floor-plan\s*\{[\s\S]*height:\s*900px/);
  assert.match(css, /\.seat-detail-panel\s*\{[\s\S]*position:\s*static/);
  assert.doesNotMatch(css, /position:\s*sticky/);
  assert.match(css, /\.table-position-1\s*\{\s*left:\s*120px/);
  assert.match(css, /\.table-position-11\s*\{\s*left:\s*1120px/);
  assert.match(css, /\.table-position-12\s*\{\s*left:\s*1090px/);
});

test("admin tasks page persists wedding to-dos to PostgreSQL", () => {
  assert.equal(existsSync(new URL("./Models/TodoItem.cs", import.meta.url)), true);
  assert.equal(existsSync(new URL("./Pages/Admin/Tasks.cshtml", import.meta.url)), true);
  assert.equal(existsSync(new URL("./Pages/Admin/Tasks.cshtml.cs", import.meta.url)), true);

  const repositoryInterface = read("./Data/IWeddingRepository.cs");
  const repository = read("./Data/WeddingRepository.cs");
  const dashboard = read("./Pages/Admin/Index.cshtml");
  const seating = read("./Pages/Admin/Seating.cshtml");
  const tasks = read("./Pages/Admin/Tasks.cshtml");
  const tasksModel = read("./Pages/Admin/Tasks.cshtml.cs");
  const css = read("./wwwroot/css/admin.css");
  const js = read("./wwwroot/js/admin.js");

  assert.match(repositoryInterface, /CreateTaskAsync/);
  assert.match(repositoryInterface, /ListTasksAsync/);
  assert.match(repositoryInterface, /UpdateTaskAsync/);
  assert.match(repositoryInterface, /UpdateTaskCompletionAsync/);
  assert.match(repositoryInterface, /DeleteTaskAsync/);
  assert.match(repository, /CREATE TABLE IF NOT EXISTS admin_tasks/);
  assert.match(repository, /ReadTask/);
  assert.match(dashboard, /\/Admin\/Tasks/);
  assert.match(seating, /\/Admin\/Tasks/);
  assert.match(tasks, /Wedding Tasks/);
  assert.match(tasks, /asp-page-handler="Create"/);
  assert.match(tasks, /asp-page-handler="Update"/);
  assert.match(tasks, /asp-page-handler="Toggle"/);
  assert.match(tasks, /asp-page-handler="Delete"/);
  assert.match(tasks, /data-task-edit-button/);
  assert.match(tasks, /data-task-delete-button/);
  assert.match(tasks, /data-toast-region/);
  assert.match(tasksModel, /\[Authorize\]/);
  assert.match(tasksModel, /OnPostCreateAsync/);
  assert.match(tasksModel, /OnPostUpdateAsync/);
  assert.match(tasksModel, /OnPostToggleAsync/);
  assert.match(tasksModel, /OnPostDeleteAsync/);
  assert.match(css, /\.task-table/);
  assert.match(js, /data-task-edit-button/);
  assert.match(js, /data-task-delete-button/);
});

test("admin people can be managed and assigned to tasks", () => {
  assert.equal(existsSync(new URL("./Models/Person.cs", import.meta.url)), true);
  assert.equal(existsSync(new URL("./Pages/Admin/People.cshtml", import.meta.url)), true);
  assert.equal(existsSync(new URL("./Pages/Admin/People.cshtml.cs", import.meta.url)), true);

  const repositoryInterface = read("./Data/IWeddingRepository.cs");
  const repository = read("./Data/WeddingRepository.cs");
  const person = read("./Models/Person.cs");
  const todo = read("./Models/TodoItem.cs");
  const dashboard = read("./Pages/Admin/Index.cshtml");
  const seating = read("./Pages/Admin/Seating.cshtml");
  const tasks = read("./Pages/Admin/Tasks.cshtml");
  const tasksModel = read("./Pages/Admin/Tasks.cshtml.cs");
  const people = read("./Pages/Admin/People.cshtml");
  const peopleModel = read("./Pages/Admin/People.cshtml.cs");
  const js = read("./wwwroot/js/admin.js");

  assert.match(person, /public sealed class Person/);
  assert.match(person, /Name/);
  assert.match(person, /Role/);
  assert.match(todo, /AssignedToPersonId/);
  assert.match(todo, /AssignedToName/);
  assert.match(repositoryInterface, /CreatePersonAsync/);
  assert.match(repositoryInterface, /ListPeopleAsync/);
  assert.match(repositoryInterface, /UpdatePersonAsync/);
  assert.match(repositoryInterface, /DeletePersonAsync/);
  assert.match(repository, /CREATE TABLE IF NOT EXISTS admin_people/);
  assert.match(repository, /assigned_to_person_id/);
  assert.match(repository, /LEFT JOIN admin_people/);
  assert.match(repository, /ReadPerson/);
  assert.match(dashboard, /\/Admin\/People/);
  assert.match(seating, /\/Admin\/People/);
  assert.match(tasks, /\/Admin\/People/);
  assert.match(tasks, /Assign to/);
  assert.match(tasks, /TaskItem\.AssignedToPersonId/);
  assert.match(tasks, /Model\.People/);
  assert.match(tasks, /Assigned/);
  assert.match(tasksModel, /IReadOnlyList<Person> People/);
  assert.match(tasksModel, /ListPeopleAsync/);
  assert.match(people, /People/);
  assert.match(people, /asp-page-handler="Create"/);
  assert.match(people, /asp-page-handler="Update"/);
  assert.match(people, /asp-page-handler="Delete"/);
  assert.match(people, /data-person-edit-button/);
  assert.match(people, /data-person-delete-button/);
  assert.match(peopleModel, /\[Authorize\]/);
  assert.match(peopleModel, /OnPostCreateAsync/);
  assert.match(peopleModel, /OnPostUpdateAsync/);
  assert.match(peopleModel, /OnPostDeleteAsync/);
  assert.match(js, /data-person-edit-button/);
  assert.match(js, /data-person-delete-button/);
  assert.match(js, /assignedToPersonId/);
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

test("v2 preview and Razor page resolve all local assets and matching tab panels", () => {
  for (const file of ["./index.html", "./Pages/Index.cshtml"]) {
    const html = read(file);
    for (const [, asset] of html.matchAll(/(?:src|href)="([^"#?]+)"/g)) {
      if (/^(https?:|\/admin)/.test(asset)) continue;
      assert.ok(existsSync(new URL(asset.replace(/^\//, "./"), import.meta.url)), file + ": missing " + asset);
    }
    for (const [, target] of html.matchAll(/aria-controls="([^"]+)"/g)) {
      assert.ok(html.includes('id="' + target + '"'), "Missing tab panel " + target);
    }
  }
});

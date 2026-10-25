# Admin Tasks Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Build an admin-only wedding tasks feature with PostgreSQL persistence.

**Architecture:** Add a small `TodoItem` model, extend `IWeddingRepository`/`WeddingRepository` with task CRUD methods and schema creation, and add a Razor Pages admin screen that reuses the existing Mazer dashboard theme, modals, and toasts.

**Tech Stack:** ASP.NET Core Razor Pages, C# 12, .NET 8, Npgsql, PostgreSQL, Mazer admin assets, Bootstrap modals.

## Global Constraints

- Tasks must be admin-only behind `[Authorize]`.
- Task data must be saved in PostgreSQL, not in browser storage or static files.
- Keep public wedding invitation pages untouched.
- Match the existing dark Mazer admin theme and toast/modal behavior.
- Use TDD: write failing tests before production code.

---

### Task 1: Test the Admin Tasks Feature

**Files:**
- Modify: `site.test.mjs`

**Interfaces:**
- Consumes: Existing `read()` helper in `site.test.mjs`.
- Produces: A failing test named `admin tasks page persists wedding to-dos to PostgreSQL`.

- [ ] **Step 1: Write the failing test**

```js
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
```

- [ ] **Step 2: Run test to verify it fails**

Run: `npm test`

Expected: FAIL because `Models/TodoItem.cs` and `Pages/Admin/Tasks.cshtml` do not exist.

### Task 2: Implement Task Persistence

**Files:**
- Create: `Models/TodoItem.cs`
- Modify: `Data/IWeddingRepository.cs`
- Modify: `Data/WeddingRepository.cs`

**Interfaces:**
- Consumes: `NpgsqlConnection` and repository initialization pattern.
- Produces: `TodoItem`, `CreateTaskAsync`, `ListTasksAsync`, `UpdateTaskAsync`, `UpdateTaskCompletionAsync`, `DeleteTaskAsync`.

- [ ] **Step 1: Create `TodoItem`**

```csharp
namespace WeddingStudioInvite.Models;

public sealed class TodoItem
{
    public long Id { get; set; }
    public string Title { get; set; } = "";
    public string Notes { get; set; } = "";
    public bool IsComplete { get; set; }
    public DateTimeOffset CreatedAt { get; set; } = DateTimeOffset.UtcNow;
    public DateTimeOffset UpdatedAt { get; set; } = DateTimeOffset.UtcNow;
}
```

- [ ] **Step 2: Add repository interface methods**

```csharp
Task<long> CreateTaskAsync(TodoItem task, CancellationToken cancellationToken = default);
Task<IReadOnlyList<TodoItem>> ListTasksAsync(CancellationToken cancellationToken = default);
Task UpdateTaskAsync(TodoItem task, CancellationToken cancellationToken = default);
Task UpdateTaskCompletionAsync(long id, bool isComplete, CancellationToken cancellationToken = default);
Task DeleteTaskAsync(long id, CancellationToken cancellationToken = default);
```

- [ ] **Step 3: Add `admin_tasks` schema and SQL methods**

Use `admin_tasks` with `id`, `title`, `notes`, `is_complete`, `created_at`, and `updated_at`.

- [ ] **Step 4: Run tests**

Run: `npm test`

Expected: Still FAIL because admin Tasks page is not implemented.

### Task 3: Implement Admin Tasks UI

**Files:**
- Create: `Pages/Admin/Tasks.cshtml`
- Create: `Pages/Admin/Tasks.cshtml.cs`
- Modify: `Pages/Admin/Index.cshtml`
- Modify: `Pages/Admin/Seating.cshtml`
- Modify: `wwwroot/css/admin.css`
- Modify: `wwwroot/js/admin.js`

**Interfaces:**
- Consumes: `IWeddingRepository` task methods.
- Produces: `/Admin/Tasks` with create, edit, toggle, delete, toasts, and sidebar navigation.

- [ ] **Step 1: Add authorized page model**

Implement `[Authorize] public sealed class TasksModel(IWeddingRepository repository) : PageModel` with `Tasks`, `TaskItem`, `ToastMessage`, `ToastTone`, `DatabaseStatusMessage`, and handlers `OnGetAsync`, `OnPostCreateAsync`, `OnPostUpdateAsync`, `OnPostToggleAsync`, and `OnPostDeleteAsync`.

- [ ] **Step 2: Add Razor page**

Use the existing admin Mazer shell, a create form, a `.task-table`, edit/delete modals, and `data-toast-region`.

- [ ] **Step 3: Add sidebar links**

Add `/Admin/Tasks` to `Pages/Admin/Index.cshtml` and `Pages/Admin/Seating.cshtml`.

- [ ] **Step 4: Add CSS and JS hooks**

Style `.task-table`; extend `admin.js` to populate task edit/delete modals from `data-task-edit-button` and `data-task-delete-button`.

- [ ] **Step 5: Run tests**

Run: `npm test`

Expected: PASS.

### Task 4: Verify Build

**Files:**
- No new files.

**Interfaces:**
- Consumes: Completed feature.
- Produces: Verified project state.

- [ ] **Step 1: Build**

Run: `/usr/local/share/dotnet/x64/dotnet build`

Expected: Build succeeds with 0 errors.

- [ ] **Step 2: Optional local smoke**

Run the app and request `/Admin/Tasks`; expect HTTP 302 when unauthenticated or 200 when logged in.

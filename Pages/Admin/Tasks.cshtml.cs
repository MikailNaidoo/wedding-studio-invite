using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.AspNetCore.Mvc.RazorPages;
using WeddingStudioInvite.Data;
using WeddingStudioInvite.Models;

namespace WeddingStudioInvite.Pages.Admin;

[Authorize]
public sealed class TasksModel(IWeddingRepository repository) : PageModel
{
    [BindProperty]
    public TodoItem TaskItem { get; set; } = new();

    [TempData]
    public string ToastMessage { get; set; } = "";

    [TempData]
    public string ToastTone { get; set; } = "success";

    public IReadOnlyList<TodoItem> Tasks { get; private set; } = [];
    public IReadOnlyList<Person> People { get; private set; } = [];
    public string DatabaseStatusMessage { get; private set; } = "";

    public async Task OnGetAsync(CancellationToken cancellationToken)
    {
        await LoadAsync(cancellationToken);
    }

    public async Task<IActionResult> OnPostCreateAsync(CancellationToken cancellationToken)
    {
        if (string.IsNullOrWhiteSpace(TaskItem.Title))
        {
            ToastMessage = "Task title is required.";
            ToastTone = "error";
            await LoadAsync(cancellationToken);
            return Page();
        }

        TaskItem.CreatedAt = DateTimeOffset.UtcNow;
        TaskItem.UpdatedAt = DateTimeOffset.UtcNow;

        try
        {
            await repository.CreateTaskAsync(TaskItem, cancellationToken);
        }
        catch (DatabaseUnavailableException)
        {
            DatabaseStatusMessage = "The task database is not running. Start PostgreSQL with docker compose up -d, then try again.";
            await LoadAsync(cancellationToken);
            return Page();
        }

        ToastMessage = $"Task created: {TaskItem.Title}.";
        ToastTone = "success";
        return RedirectToPage();
    }

    public async Task<IActionResult> OnPostUpdateAsync(CancellationToken cancellationToken)
    {
        if (string.IsNullOrWhiteSpace(TaskItem.Title))
        {
            ToastMessage = "Task title is required.";
            ToastTone = "error";
            await LoadAsync(cancellationToken);
            return Page();
        }

        TaskItem.UpdatedAt = DateTimeOffset.UtcNow;

        try
        {
            await repository.UpdateTaskAsync(TaskItem, cancellationToken);
        }
        catch (DatabaseUnavailableException)
        {
            DatabaseStatusMessage = "The task database is not running. Start PostgreSQL with docker compose up -d, then try again.";
            await LoadAsync(cancellationToken);
            return Page();
        }

        ToastMessage = $"Task updated: {TaskItem.Title}.";
        ToastTone = "success";
        return RedirectToPage();
    }

    public async Task<IActionResult> OnPostToggleAsync(long id, bool isComplete, CancellationToken cancellationToken)
    {
        try
        {
            await repository.UpdateTaskCompletionAsync(id, isComplete, cancellationToken);
        }
        catch (DatabaseUnavailableException)
        {
            DatabaseStatusMessage = "The task database is not running. Start PostgreSQL with docker compose up -d, then try again.";
            await LoadAsync(cancellationToken);
            return Page();
        }

        ToastMessage = isComplete ? "Task marked complete." : "Task moved back to pending.";
        ToastTone = "success";
        return RedirectToPage();
    }

    public async Task<IActionResult> OnPostDeleteAsync(long id, CancellationToken cancellationToken)
    {
        try
        {
            await repository.DeleteTaskAsync(id, cancellationToken);
        }
        catch (DatabaseUnavailableException)
        {
            DatabaseStatusMessage = "The task database is not running. Start PostgreSQL with docker compose up -d, then try again.";
            await LoadAsync(cancellationToken);
            return Page();
        }

        ToastMessage = "Task deleted.";
        ToastTone = "success";
        return RedirectToPage();
    }

    private async Task LoadAsync(CancellationToken cancellationToken)
    {
        try
        {
            Tasks = await repository.ListTasksAsync(cancellationToken);
            People = await repository.ListPeopleAsync(cancellationToken);
        }
        catch (DatabaseUnavailableException)
        {
            DatabaseStatusMessage = "The task database is not running. Start PostgreSQL with docker compose up -d, then refresh this page.";
            Tasks = [];
            People = [];
        }
    }
}

using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.AspNetCore.Mvc.RazorPages;
using WeddingStudioInvite.Data;
using WeddingStudioInvite.Models;

namespace WeddingStudioInvite.Pages.Admin;

[Authorize]
public sealed class PeopleModel(IWeddingRepository repository) : PageModel
{
    [BindProperty]
    public Person PersonItem { get; set; } = new();

    [TempData]
    public string ToastMessage { get; set; } = "";

    [TempData]
    public string ToastTone { get; set; } = "success";

    public IReadOnlyList<Person> People { get; private set; } = [];
    public string DatabaseStatusMessage { get; private set; } = "";

    public async Task OnGetAsync(CancellationToken cancellationToken)
    {
        await LoadAsync(cancellationToken);
    }

    public async Task<IActionResult> OnPostCreateAsync(CancellationToken cancellationToken)
    {
        if (string.IsNullOrWhiteSpace(PersonItem.Name))
        {
            ToastMessage = "Person name is required.";
            ToastTone = "error";
            await LoadAsync(cancellationToken);
            return Page();
        }

        PersonItem.CreatedAt = DateTimeOffset.UtcNow;
        PersonItem.UpdatedAt = DateTimeOffset.UtcNow;

        try
        {
            await repository.CreatePersonAsync(PersonItem, cancellationToken);
        }
        catch (DatabaseUnavailableException)
        {
            DatabaseStatusMessage = "The people database is not running. Start PostgreSQL with docker compose up -d, then try again.";
            await LoadAsync(cancellationToken);
            return Page();
        }

        ToastMessage = $"Person created: {PersonItem.Name}.";
        ToastTone = "success";
        return RedirectToPage();
    }

    public async Task<IActionResult> OnPostUpdateAsync(CancellationToken cancellationToken)
    {
        if (string.IsNullOrWhiteSpace(PersonItem.Name))
        {
            ToastMessage = "Person name is required.";
            ToastTone = "error";
            await LoadAsync(cancellationToken);
            return Page();
        }

        PersonItem.UpdatedAt = DateTimeOffset.UtcNow;

        try
        {
            await repository.UpdatePersonAsync(PersonItem, cancellationToken);
        }
        catch (DatabaseUnavailableException)
        {
            DatabaseStatusMessage = "The people database is not running. Start PostgreSQL with docker compose up -d, then try again.";
            await LoadAsync(cancellationToken);
            return Page();
        }

        ToastMessage = $"Person updated: {PersonItem.Name}.";
        ToastTone = "success";
        return RedirectToPage();
    }

    public async Task<IActionResult> OnPostDeleteAsync(long id, CancellationToken cancellationToken)
    {
        try
        {
            await repository.DeletePersonAsync(id, cancellationToken);
        }
        catch (DatabaseUnavailableException)
        {
            DatabaseStatusMessage = "The people database is not running. Start PostgreSQL with docker compose up -d, then try again.";
            await LoadAsync(cancellationToken);
            return Page();
        }

        ToastMessage = "Person deleted and removed from assigned tasks.";
        ToastTone = "success";
        return RedirectToPage();
    }

    private async Task LoadAsync(CancellationToken cancellationToken)
    {
        try
        {
            People = await repository.ListPeopleAsync(cancellationToken);
        }
        catch (DatabaseUnavailableException)
        {
            DatabaseStatusMessage = "The people database is not running. Start PostgreSQL with docker compose up -d, then refresh this page.";
            People = [];
        }
    }
}

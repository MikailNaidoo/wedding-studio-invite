using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.AspNetCore.Mvc.RazorPages;
using WeddingStudioInvite.Data;
using WeddingStudioInvite.Models;

namespace WeddingStudioInvite.Pages.Admin;

[Authorize]
public sealed class IndexModel(IWeddingRepository repository) : PageModel
{
    [BindProperty(SupportsGet = true)]
    public string Search { get; set; } = "";

    [BindProperty(SupportsGet = true)]
    public string Filter { get; set; } = "";

    [BindProperty(SupportsGet = false)]
    public RsvpSubmission Entry { get; set; } = new();

    [TempData]
    public string ToastMessage { get; set; } = "";

    [TempData]
    public string ToastTone { get; set; } = "success";

    public DashboardStats Stats { get; private set; } = new(0, 0, 0, 0, 0, 0, 0);
    public IReadOnlyList<RsvpSubmission> Submissions { get; private set; } = [];
    public Dictionary<long, IReadOnlyList<RsvpSubmission>> DuplicateWarnings { get; private set; } = [];
    public string DatabaseStatusMessage { get; private set; } = "";

    public async Task OnGetAsync(CancellationToken cancellationToken)
    {
        await LoadAsync(cancellationToken);
    }

    public async Task<IActionResult> OnPostCreateAsync(CancellationToken cancellationToken)
    {
        Entry.AdminStatus = Entry.AdminStatus is AdminStatus.Confirmed ? AdminStatus.Confirmed : AdminStatus.Pending;
        Entry.SubmittedAt = DateTimeOffset.UtcNow;
        Entry.UpdatedAt = DateTimeOffset.UtcNow;
        try
        {
            await repository.CreateAsync(Entry, cancellationToken);
        }
        catch (DatabaseUnavailableException)
        {
            DatabaseStatusMessage = "The RSVP database is not running. Start PostgreSQL with docker compose up -d, then try again.";
            return Page();
        }

        ToastMessage = $"RSVP created for {Entry.FullName}.";
        ToastTone = "success";
        return RedirectToPage(new { Search, Filter });
    }

    public async Task<IActionResult> OnPostUpdateAsync(CancellationToken cancellationToken)
    {
        Entry.UpdatedAt = DateTimeOffset.UtcNow;
        try
        {
            await repository.UpdateAsync(Entry, cancellationToken);
        }
        catch (DatabaseUnavailableException)
        {
            DatabaseStatusMessage = "The RSVP database is not running. Start PostgreSQL with docker compose up -d, then try again.";
            return Page();
        }

        ToastMessage = $"RSVP updated for {Entry.FullName}.";
        ToastTone = "success";
        return RedirectToPage(new { Search, Filter });
    }

    public async Task<IActionResult> OnPostDeleteAsync(long id, CancellationToken cancellationToken)
    {
        try
        {
            await repository.DeleteAsync(id, cancellationToken);
        }
        catch (DatabaseUnavailableException)
        {
            DatabaseStatusMessage = "The RSVP database is not running. Start PostgreSQL with docker compose up -d, then try again.";
            return Page();
        }

        ToastMessage = "RSVP deleted.";
        ToastTone = "success";
        return RedirectToPage(new { Search, Filter });
    }

    public async Task<IActionResult> OnPostStatusAsync(long id, AdminStatus status, CancellationToken cancellationToken)
    {
        try
        {
            await repository.UpdateStatusAsync(id, status, cancellationToken);
            return new JsonResult(new { ok = true, status = status.ToString(), savedAt = DateTimeOffset.Now.ToString("HH:mm") });
        }
        catch (DatabaseUnavailableException ex)
        {
            return new JsonResult(new { ok = false, message = ex.Message }) { StatusCode = StatusCodes.Status503ServiceUnavailable };
        }
    }

    public async Task<IActionResult> OnGetExportAsync(CancellationToken cancellationToken)
    {
        try
        {
            var csv = await repository.ExportCsvAsync(cancellationToken);
            return File(csv, "text/csv", "mikail-dershia-rsvps.csv");
        }
        catch (DatabaseUnavailableException)
        {
            DatabaseStatusMessage = "The RSVP database is not running. Start PostgreSQL with docker compose up -d, then try again.";
            ToastMessage = DatabaseStatusMessage;
            ToastTone = "error";
            return Page();
        }
    }

    private async Task LoadAsync(CancellationToken cancellationToken)
    {
        try
        {
            Stats = await repository.GetStatsAsync(cancellationToken);
            Submissions = await repository.ListAsync(new RsvpQuery(Search ?? "", Filter ?? ""), cancellationToken);
        }
        catch (DatabaseUnavailableException)
        {
            DatabaseStatusMessage = "The RSVP database is not running. Start PostgreSQL with docker compose up -d, then refresh this page.";
            Stats = new DashboardStats(0, 0, 0, 0, 0, 0, 0);
            Submissions = [];
            DuplicateWarnings = [];
            return;
        }

        var duplicateWarnings = new Dictionary<long, IReadOnlyList<RsvpSubmission>>();
        foreach (var submission in Submissions)
        {
            var duplicates = await repository.FindPossibleDuplicatesAsync(submission.FullName, submission.Id, cancellationToken);
            if (duplicates.Count > 0)
            {
                duplicateWarnings[submission.Id] = duplicates;
            }
        }

        DuplicateWarnings = duplicateWarnings;
    }
}

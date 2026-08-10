using Microsoft.AspNetCore.Mvc;
using Microsoft.AspNetCore.Mvc.RazorPages;
using WeddingStudioInvite.Data;
using WeddingStudioInvite.Models;
using WeddingStudioInvite.Services;

namespace WeddingStudioInvite.Pages;

public sealed class IndexModel(IWeddingRepository repository, RsvpSpamGuard spamGuard) : PageModel
{
    [BindProperty]
    public RsvpInput Input { get; set; } = new();

    [TempData]
    public string FormStatus { get; set; } = "";

    public long StartedAtTicks { get; private set; } = DateTimeOffset.UtcNow.Ticks;

    public void OnGet()
    {
        StartedAtTicks = DateTimeOffset.UtcNow.Ticks;
    }

    public async Task<IActionResult> OnPostRsvpAsync(CancellationToken cancellationToken)
    {
        StartedAtTicks = Input.StartedAtTicks > 0 ? Input.StartedAtTicks : DateTimeOffset.UtcNow.Ticks;

        var spamResult = spamGuard.Validate(Input, DateTimeOffset.UtcNow);
        if (spamResult.IsSpam)
        {
            ModelState.AddModelError(string.Empty, "We could not send that RSVP. Please refresh and try again.");
            return Page();
        }

        if (!ModelState.IsValid || Input.Attending is null)
        {
            return Page();
        }

        var submission = new RsvpSubmission
        {
            FullName = Input.FullName.Trim(),
            Attending = Input.Attending.Value,
            GuestCount = Input.Attending.Value ? Math.Max(Input.GuestCount, 1) : 0,
            DietaryNotes = Input.DietaryNotes?.Trim() ?? "",
            GuestMessage = Input.GuestMessage?.Trim() ?? "",
            AdminStatus = AdminStatus.Pending,
            SubmittedAt = DateTimeOffset.UtcNow,
            UpdatedAt = DateTimeOffset.UtcNow,
            IpAddress = HttpContext.Connection.RemoteIpAddress?.ToString() ?? "",
            UserAgent = Request.Headers.UserAgent.ToString()
        };

        try
        {
            await repository.CreateAsync(submission, cancellationToken);
        }
        catch (DatabaseUnavailableException)
        {
            ModelState.AddModelError(string.Empty, "The RSVP database is not running. Start PostgreSQL with docker compose up -d, then try again.");
            return Page();
        }

        FormStatus = $"Thank you, {submission.FullName}. Your RSVP has been saved.";
        return Redirect("/#rsvp");
    }
}

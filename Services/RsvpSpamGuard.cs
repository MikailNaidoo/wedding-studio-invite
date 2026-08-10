using System.Text.RegularExpressions;
using WeddingStudioInvite.Models;

namespace WeddingStudioInvite.Services;

public sealed class RsvpSpamGuard
{
    private static readonly Regex UrlPattern = new(@"https?:\/\/|www\.", RegexOptions.IgnoreCase | RegexOptions.Compiled);
    private static readonly TimeSpan MinimumSubmissionAge = TimeSpan.FromSeconds(3);

    public (bool IsSpam, string Reason) Validate(RsvpInput input, DateTimeOffset now)
    {
        if (!string.IsNullOrWhiteSpace(input.Website))
        {
            return (true, "Rejected by honeypot.");
        }

        if (input.StartedAtTicks <= 0)
        {
            return (true, "Missing form timing token.");
        }

        var startedAt = new DateTimeOffset(input.StartedAtTicks, TimeSpan.Zero);
        if (now - startedAt < MinimumSubmissionAge)
        {
            return (true, "Submitted too quickly.");
        }

        if (string.IsNullOrWhiteSpace(input.FullName) || input.FullName.Trim().Length < 2)
        {
            return (true, "Missing guest name.");
        }

        if (input.GuestCount is < 0 or > 12)
        {
            return (true, "Guest count outside allowed range.");
        }

        var combinedText = $"{input.FullName} {input.DietaryNotes ?? ""} {input.GuestMessage ?? ""}";
        if (UrlPattern.Matches(combinedText).Count > 1)
        {
            return (true, "Too many links in RSVP.");
        }

        return (false, "");
    }
}

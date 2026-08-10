using System.ComponentModel.DataAnnotations;

namespace WeddingStudioInvite.Models;

public sealed class RsvpSubmission
{
    public long Id { get; set; }

    [Required, StringLength(160)]
    public string FullName { get; set; } = "";

    public bool Attending { get; set; }

    [Range(0, 12)]
    public int GuestCount { get; set; } = 1;

    [StringLength(1000)]
    public string DietaryNotes { get; set; } = "";

    [StringLength(1200)]
    public string GuestMessage { get; set; } = "";

    [StringLength(1200)]
    public string AdminNotes { get; set; } = "";

    public AdminStatus AdminStatus { get; set; } = AdminStatus.Pending;

    public DateTimeOffset SubmittedAt { get; set; } = DateTimeOffset.UtcNow;

    public DateTimeOffset UpdatedAt { get; set; } = DateTimeOffset.UtcNow;

    [StringLength(80)]
    public string IpAddress { get; set; } = "";

    [StringLength(500)]
    public string UserAgent { get; set; } = "";

    [StringLength(300)]
    public string RejectedReason { get; set; } = "";
}

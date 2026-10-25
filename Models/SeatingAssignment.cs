using System.ComponentModel.DataAnnotations;

namespace WeddingStudioInvite.Models;

public sealed class SeatingAssignment
{
    public long RsvpSubmissionId { get; set; }

    [Range(1, 15)]
    public int TableNumber { get; set; } = 1;

    [Range(1, 10)]
    public int SeatNumber { get; set; } = 1;

    public string GuestName { get; set; } = "";
    public DateTimeOffset UpdatedAt { get; set; } = DateTimeOffset.UtcNow;
}

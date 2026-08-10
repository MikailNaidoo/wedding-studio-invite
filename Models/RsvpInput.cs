using System.ComponentModel.DataAnnotations;

namespace WeddingStudioInvite.Models;

public sealed class RsvpInput
{
    [Required(ErrorMessage = "Please enter your full name.")]
    [StringLength(160)]
    public string FullName { get; set; } = "";

    [Required(ErrorMessage = "Please choose whether you can attend.")]
    public bool? Attending { get; set; }

    [Range(0, 12, ErrorMessage = "Please enter between 0 and 12 guests.")]
    public int GuestCount { get; set; } = 1;

    [StringLength(1000)]
    public string? DietaryNotes { get; set; }

    [StringLength(1200)]
    public string? GuestMessage { get; set; }

    [StringLength(200)]
    public string? Website { get; set; }

    public long StartedAtTicks { get; set; }
}

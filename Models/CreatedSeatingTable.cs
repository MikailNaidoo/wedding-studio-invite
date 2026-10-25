namespace WeddingStudioInvite.Models;

public sealed class CreatedSeatingTable
{
    public int TableNumber { get; set; }
    public DateTimeOffset CreatedAt { get; set; } = DateTimeOffset.UtcNow;
    public DateTimeOffset UpdatedAt { get; set; } = DateTimeOffset.UtcNow;
}

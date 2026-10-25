namespace WeddingStudioInvite.Models;

public sealed class SeatingLayoutPosition
{
    public int TableNumber { get; set; }
    public decimal XPercent { get; set; }
    public decimal YPercent { get; set; }
    public DateTimeOffset UpdatedAt { get; set; } = DateTimeOffset.UtcNow;
}

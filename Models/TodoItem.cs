namespace WeddingStudioInvite.Models;

public sealed class TodoItem
{
    public long Id { get; set; }
    public string Title { get; set; } = "";
    public string Notes { get; set; } = "";
    public long? AssignedToPersonId { get; set; }
    public string AssignedToName { get; set; } = "";
    public bool IsComplete { get; set; }
    public DateTimeOffset CreatedAt { get; set; } = DateTimeOffset.UtcNow;
    public DateTimeOffset UpdatedAt { get; set; } = DateTimeOffset.UtcNow;
}

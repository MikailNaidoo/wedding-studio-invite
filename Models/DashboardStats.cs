namespace WeddingStudioInvite.Models;

public sealed record DashboardStats(
    int TotalSubmissions,
    int PeopleAttending,
    int PeopleNotAttending,
    int Pending,
    int Confirmed,
    int DietaryNotes,
    int LastSevenDays);

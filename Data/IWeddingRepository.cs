using WeddingStudioInvite.Models;

namespace WeddingStudioInvite.Data;

public interface IWeddingRepository
{
    Task InitializeAsync(CancellationToken cancellationToken = default);
    Task<long> CreateAsync(RsvpSubmission submission, CancellationToken cancellationToken = default);
    Task<IReadOnlyList<RsvpSubmission>> ListAsync(RsvpQuery query, CancellationToken cancellationToken = default);
    Task<DashboardStats> GetStatsAsync(CancellationToken cancellationToken = default);
    Task<IReadOnlyList<RsvpSubmission>> FindPossibleDuplicatesAsync(string fullName, long? excludingId = null, CancellationToken cancellationToken = default);
    Task UpdateAsync(RsvpSubmission submission, CancellationToken cancellationToken = default);
    Task UpdateStatusAsync(long id, AdminStatus status, CancellationToken cancellationToken = default);
    Task DeleteAsync(long id, CancellationToken cancellationToken = default);
    Task<byte[]> ExportCsvAsync(CancellationToken cancellationToken = default);
    Task<long> CreateTaskAsync(TodoItem task, CancellationToken cancellationToken = default);
    Task<IReadOnlyList<TodoItem>> ListTasksAsync(CancellationToken cancellationToken = default);
    Task UpdateTaskAsync(TodoItem task, CancellationToken cancellationToken = default);
    Task UpdateTaskCompletionAsync(long id, bool isComplete, CancellationToken cancellationToken = default);
    Task DeleteTaskAsync(long id, CancellationToken cancellationToken = default);
    Task<long> CreatePersonAsync(Person person, CancellationToken cancellationToken = default);
    Task<IReadOnlyList<Person>> ListPeopleAsync(CancellationToken cancellationToken = default);
    Task UpdatePersonAsync(Person person, CancellationToken cancellationToken = default);
    Task DeletePersonAsync(long id, CancellationToken cancellationToken = default);
    Task<IReadOnlyList<RsvpSubmission>> ListAttendingGuestsAsync(CancellationToken cancellationToken = default);
    Task<IReadOnlyList<CreatedSeatingTable>> ListCreatedSeatingTablesAsync(CancellationToken cancellationToken = default);
    Task CreateSeatingTableAsync(int tableNumber, CancellationToken cancellationToken = default);
    Task<IReadOnlyList<SeatingLayoutPosition>> ListSeatingLayoutAsync(CancellationToken cancellationToken = default);
    Task SaveSeatingLayoutAsync(IReadOnlyList<SeatingLayoutPosition> positions, CancellationToken cancellationToken = default);
    Task<IReadOnlyList<SeatingAssignment>> ListSeatingAssignmentsAsync(CancellationToken cancellationToken = default);
    Task SaveSeatingAssignmentAsync(SeatingAssignment assignment, CancellationToken cancellationToken = default);
    Task ClearSeatingAssignmentAsync(long rsvpSubmissionId, CancellationToken cancellationToken = default);
}

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
}

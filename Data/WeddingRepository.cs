using System.Text;
using Npgsql;
using WeddingStudioInvite.Models;

namespace WeddingStudioInvite.Data;

public sealed class WeddingRepository(IConfiguration configuration) : IWeddingRepository
{
    private readonly string _connectionString = DatabaseSettings.GetConnectionString(configuration);
    private readonly SemaphoreSlim _initLock = new(1, 1);
    private bool _initialized;

    public async Task InitializeAsync(CancellationToken cancellationToken = default)
    {
        const string sql = """
            CREATE TABLE IF NOT EXISTS rsvp_submissions (
                id BIGSERIAL PRIMARY KEY,
                full_name TEXT NOT NULL,
                attending BOOLEAN NOT NULL,
                guest_count INTEGER NOT NULL DEFAULT 1,
                dietary_notes TEXT NOT NULL DEFAULT '',
                guest_message TEXT NOT NULL DEFAULT '',
                admin_notes TEXT NOT NULL DEFAULT '',
                admin_status TEXT NOT NULL DEFAULT 'Pending',
                submitted_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
                updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
                ip_address TEXT NOT NULL DEFAULT '',
                user_agent TEXT NOT NULL DEFAULT '',
                rejected_reason TEXT NOT NULL DEFAULT ''
            );
            CREATE INDEX IF NOT EXISTS ix_rsvp_submissions_full_name ON rsvp_submissions (LOWER(full_name));
            CREATE INDEX IF NOT EXISTS ix_rsvp_submissions_admin_status ON rsvp_submissions (admin_status);
            """;

        await using var connection = await OpenConnectionAsync(cancellationToken);
        await using var command = new NpgsqlCommand(sql, connection);
        await command.ExecuteNonQueryAsync(cancellationToken);
    }

    public async Task<long> CreateAsync(RsvpSubmission submission, CancellationToken cancellationToken = default)
    {
        await EnsureInitializedAsync(cancellationToken);
        const string sql = """
            INSERT INTO rsvp_submissions
                (full_name, attending, guest_count, dietary_notes, guest_message, admin_notes, admin_status, submitted_at, updated_at, ip_address, user_agent, rejected_reason)
            VALUES
                (@full_name, @attending, @guest_count, @dietary_notes, @guest_message, @admin_notes, @admin_status, @submitted_at, @updated_at, @ip_address, @user_agent, @rejected_reason)
            RETURNING id;
            """;

        await using var connection = await OpenConnectionAsync(cancellationToken);
        await using var command = new NpgsqlCommand(sql, connection);
        AddSubmissionParameters(command, submission);
        return (long)(await command.ExecuteScalarAsync(cancellationToken) ?? 0L);
    }

    public async Task<IReadOnlyList<RsvpSubmission>> ListAsync(RsvpQuery query, CancellationToken cancellationToken = default)
    {
        await EnsureInitializedAsync(cancellationToken);
        var where = new List<string>();
        await using var connection = await OpenConnectionAsync(cancellationToken);
        await using var command = connection.CreateCommand();

        if (!string.IsNullOrWhiteSpace(query.Search))
        {
            where.Add("full_name ILIKE @search");
            command.Parameters.AddWithValue("search", $"%{query.Search.Trim()}%");
        }

        switch (query.Filter)
        {
            case "attending":
                where.Add("attending = TRUE");
                break;
            case "not-attending":
                where.Add("attending = FALSE");
                break;
            case "pending":
                where.Add("admin_status = 'Pending'");
                break;
            case "confirmed":
                where.Add("admin_status = 'Confirmed'");
                break;
        }

        command.CommandText = $"""
            SELECT id, full_name, attending, guest_count, dietary_notes, guest_message, admin_notes, admin_status,
                   submitted_at, updated_at, ip_address, user_agent, rejected_reason
            FROM rsvp_submissions
            {(where.Count > 0 ? "WHERE " + string.Join(" AND ", where) : "")}
            ORDER BY submitted_at DESC, id DESC
            LIMIT 500;
            """;

        var submissions = new List<RsvpSubmission>();
        await using var reader = await command.ExecuteReaderAsync(cancellationToken);
        while (await reader.ReadAsync(cancellationToken))
        {
            submissions.Add(ReadSubmission(reader));
        }

        return submissions;
    }

    public async Task<DashboardStats> GetStatsAsync(CancellationToken cancellationToken = default)
    {
        await EnsureInitializedAsync(cancellationToken);
        const string sql = """
            SELECT
              COUNT(*)::int AS total_submissions,
              COALESCE(SUM(CASE WHEN attending THEN guest_count ELSE 0 END), 0)::int AS people_attending,
              COALESCE(SUM(CASE WHEN NOT attending THEN GREATEST(guest_count, 1) ELSE 0 END), 0)::int AS people_not_attending,
              COALESCE(SUM(CASE WHEN admin_status = 'Pending' THEN 1 ELSE 0 END), 0)::int AS pending,
              COALESCE(SUM(CASE WHEN admin_status = 'Confirmed' THEN 1 ELSE 0 END), 0)::int AS confirmed,
              COALESCE(SUM(CASE WHEN LENGTH(TRIM(dietary_notes)) > 0 THEN 1 ELSE 0 END), 0)::int AS dietary_notes,
              COALESCE(SUM(CASE WHEN submitted_at >= NOW() - INTERVAL '7 days' THEN 1 ELSE 0 END), 0)::int AS last_seven_days
            FROM rsvp_submissions;
            """;

        await using var connection = await OpenConnectionAsync(cancellationToken);
        await using var command = new NpgsqlCommand(sql, connection);
        await using var reader = await command.ExecuteReaderAsync(cancellationToken);
        if (!await reader.ReadAsync(cancellationToken))
        {
            return new DashboardStats(0, 0, 0, 0, 0, 0, 0);
        }

        return new DashboardStats(
            reader.GetInt32(0),
            reader.GetInt32(1),
            reader.GetInt32(2),
            reader.GetInt32(3),
            reader.GetInt32(4),
            reader.GetInt32(5),
            reader.GetInt32(6));
    }

    public async Task<IReadOnlyList<RsvpSubmission>> FindPossibleDuplicatesAsync(string fullName, long? excludingId = null, CancellationToken cancellationToken = default)
    {
        await EnsureInitializedAsync(cancellationToken);
        const string sql = """
            SELECT id, full_name, attending, guest_count, dietary_notes, guest_message, admin_notes, admin_status,
                   submitted_at, updated_at, ip_address, user_agent, rejected_reason
            FROM rsvp_submissions
            WHERE LOWER(full_name) = LOWER(@full_name)
              AND (@excluding_id IS NULL OR id <> @excluding_id)
            ORDER BY submitted_at DESC;
            """;

        await using var connection = await OpenConnectionAsync(cancellationToken);
        await using var command = new NpgsqlCommand(sql, connection);
        command.Parameters.AddWithValue("full_name", fullName.Trim());
        command.Parameters.AddWithValue("excluding_id", excludingId.HasValue ? excludingId.Value : DBNull.Value);

        var submissions = new List<RsvpSubmission>();
        await using var reader = await command.ExecuteReaderAsync(cancellationToken);
        while (await reader.ReadAsync(cancellationToken))
        {
            submissions.Add(ReadSubmission(reader));
        }

        return submissions;
    }

    public async Task UpdateAsync(RsvpSubmission submission, CancellationToken cancellationToken = default)
    {
        await EnsureInitializedAsync(cancellationToken);
        const string sql = """
            UPDATE rsvp_submissions
            SET full_name = @full_name,
                attending = @attending,
                guest_count = @guest_count,
                dietary_notes = @dietary_notes,
                guest_message = @guest_message,
                admin_notes = @admin_notes,
                admin_status = @admin_status,
                updated_at = @updated_at
            WHERE id = @id;
            """;

        await using var connection = await OpenConnectionAsync(cancellationToken);
        await using var command = new NpgsqlCommand(sql, connection);
        AddSubmissionParameters(command, submission);
        command.Parameters.AddWithValue("id", submission.Id);
        await command.ExecuteNonQueryAsync(cancellationToken);
    }

    public async Task UpdateStatusAsync(long id, AdminStatus status, CancellationToken cancellationToken = default)
    {
        await EnsureInitializedAsync(cancellationToken);
        const string sql = "UPDATE rsvp_submissions SET admin_status = @admin_status, updated_at = @updated_at WHERE id = @id;";
        await using var connection = await OpenConnectionAsync(cancellationToken);
        await using var command = new NpgsqlCommand(sql, connection);
        command.Parameters.AddWithValue("id", id);
        command.Parameters.AddWithValue("admin_status", status.ToString());
        command.Parameters.AddWithValue("updated_at", DateTimeOffset.UtcNow);
        await command.ExecuteNonQueryAsync(cancellationToken);
    }

    public async Task DeleteAsync(long id, CancellationToken cancellationToken = default)
    {
        await EnsureInitializedAsync(cancellationToken);
        await using var connection = await OpenConnectionAsync(cancellationToken);
        await using var command = new NpgsqlCommand("DELETE FROM rsvp_submissions WHERE id = @id;", connection);
        command.Parameters.AddWithValue("id", id);
        await command.ExecuteNonQueryAsync(cancellationToken);
    }

    public async Task<byte[]> ExportCsvAsync(CancellationToken cancellationToken = default)
    {
        var rows = await ListAsync(new RsvpQuery("", ""), cancellationToken);
        var csv = new StringBuilder();
        csv.AppendLine("Id,Full name,Attending,Guest count,Dietary notes,Guest message,Admin notes,Status,Submitted at");
        foreach (var row in rows)
        {
            csv.AppendLine(string.Join(',', new[]
            {
                row.Id.ToString(),
                Csv(row.FullName),
                row.Attending ? "Yes" : "No",
                row.GuestCount.ToString(),
                Csv(row.DietaryNotes),
                Csv(row.GuestMessage),
                Csv(row.AdminNotes),
                row.AdminStatus.ToString(),
                row.SubmittedAt.ToString("u")
            }));
        }

        return Encoding.UTF8.GetBytes(csv.ToString());
    }

    private async Task EnsureInitializedAsync(CancellationToken cancellationToken)
    {
        if (_initialized)
        {
            return;
        }

        await _initLock.WaitAsync(cancellationToken);
        try
        {
            if (_initialized)
            {
                return;
            }

            await InitializeAsync(cancellationToken);
            _initialized = true;
        }
        finally
        {
            _initLock.Release();
        }
    }

    private async Task<NpgsqlConnection> OpenConnectionAsync(CancellationToken cancellationToken)
    {
        var connection = new NpgsqlConnection(_connectionString);
        try
        {
            await connection.OpenAsync(cancellationToken);
            return connection;
        }
        catch (NpgsqlException ex)
        {
            await connection.DisposeAsync();
            throw new DatabaseUnavailableException(
                "PostgreSQL is not available. Start the local database with `docker compose up -d` or update the connection string.",
                ex);
        }
    }

    private static void AddSubmissionParameters(NpgsqlCommand command, RsvpSubmission submission)
    {
        command.Parameters.AddWithValue("full_name", submission.FullName.Trim());
        command.Parameters.AddWithValue("attending", submission.Attending);
        command.Parameters.AddWithValue("guest_count", submission.GuestCount);
        command.Parameters.AddWithValue("dietary_notes", submission.DietaryNotes.Trim());
        command.Parameters.AddWithValue("guest_message", submission.GuestMessage.Trim());
        command.Parameters.AddWithValue("admin_notes", submission.AdminNotes.Trim());
        command.Parameters.AddWithValue("admin_status", submission.AdminStatus.ToString());
        command.Parameters.AddWithValue("submitted_at", submission.SubmittedAt);
        command.Parameters.AddWithValue("updated_at", DateTimeOffset.UtcNow);
        command.Parameters.AddWithValue("ip_address", submission.IpAddress);
        command.Parameters.AddWithValue("user_agent", submission.UserAgent);
        command.Parameters.AddWithValue("rejected_reason", submission.RejectedReason);
    }

    private static RsvpSubmission ReadSubmission(NpgsqlDataReader reader)
    {
        return new RsvpSubmission
        {
            Id = reader.GetInt64(0),
            FullName = reader.GetString(1),
            Attending = reader.GetBoolean(2),
            GuestCount = reader.GetInt32(3),
            DietaryNotes = reader.GetString(4),
            GuestMessage = reader.GetString(5),
            AdminNotes = reader.GetString(6),
            AdminStatus = Enum.TryParse<AdminStatus>(reader.GetString(7), out var status) ? status : AdminStatus.Pending,
            SubmittedAt = reader.GetFieldValue<DateTimeOffset>(8),
            UpdatedAt = reader.GetFieldValue<DateTimeOffset>(9),
            IpAddress = reader.GetString(10),
            UserAgent = reader.GetString(11),
            RejectedReason = reader.GetString(12)
        };
    }

    private static string Csv(string value)
    {
        var escaped = value.Replace("\"", "\"\"");
        return $"\"{escaped}\"";
    }
}

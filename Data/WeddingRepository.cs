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

            CREATE TABLE IF NOT EXISTS admin_tasks (
                id BIGSERIAL PRIMARY KEY,
                title TEXT NOT NULL,
                notes TEXT NOT NULL DEFAULT '',
                assigned_to_person_id BIGINT NULL,
                is_complete BOOLEAN NOT NULL DEFAULT FALSE,
                created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
                updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
            );
            CREATE TABLE IF NOT EXISTS admin_people (
                id BIGSERIAL PRIMARY KEY,
                name TEXT NOT NULL,
                role TEXT NOT NULL DEFAULT '',
                created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
                updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
            );
            CREATE TABLE IF NOT EXISTS seating_layout (
                table_number INTEGER PRIMARY KEY,
                x_percent NUMERIC(6, 3) NOT NULL,
                y_percent NUMERIC(6, 3) NOT NULL,
                updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
            );
            CREATE TABLE IF NOT EXISTS created_seating_tables (
                table_number INTEGER PRIMARY KEY,
                created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
                updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
            );
            CREATE TABLE IF NOT EXISTS guest_seating_assignments (
                rsvp_submission_id BIGINT NOT NULL UNIQUE REFERENCES rsvp_submissions(id) ON DELETE CASCADE,
                table_number INTEGER NOT NULL,
                seat_number INTEGER NOT NULL,
                updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
                UNIQUE (table_number, seat_number)
            );
            ALTER TABLE admin_tasks ADD COLUMN IF NOT EXISTS assigned_to_person_id BIGINT NULL;
            CREATE INDEX IF NOT EXISTS ix_admin_tasks_is_complete ON admin_tasks (is_complete);
            CREATE INDEX IF NOT EXISTS ix_admin_tasks_assigned_to_person_id ON admin_tasks (assigned_to_person_id);
            CREATE INDEX IF NOT EXISTS ix_admin_people_name ON admin_people (LOWER(name));
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

    public async Task<long> CreateTaskAsync(TodoItem task, CancellationToken cancellationToken = default)
    {
        await EnsureInitializedAsync(cancellationToken);
        const string sql = """
            INSERT INTO admin_tasks (title, notes, assigned_to_person_id, is_complete, created_at, updated_at)
            VALUES (@title, @notes, @assigned_to_person_id, @is_complete, @created_at, @updated_at)
            RETURNING id;
            """;

        await using var connection = await OpenConnectionAsync(cancellationToken);
        await using var command = new NpgsqlCommand(sql, connection);
        AddTaskParameters(command, task);
        return (long)(await command.ExecuteScalarAsync(cancellationToken) ?? 0L);
    }

    public async Task<IReadOnlyList<TodoItem>> ListTasksAsync(CancellationToken cancellationToken = default)
    {
        await EnsureInitializedAsync(cancellationToken);
        const string sql = """
            SELECT t.id, t.title, t.notes, t.assigned_to_person_id, COALESCE(p.name, '') AS assigned_to_name,
                   t.is_complete, t.created_at, t.updated_at
            FROM admin_tasks t
            LEFT JOIN admin_people p ON p.id = t.assigned_to_person_id
            ORDER BY t.is_complete ASC, t.updated_at DESC, t.id DESC;
            """;

        await using var connection = await OpenConnectionAsync(cancellationToken);
        await using var command = new NpgsqlCommand(sql, connection);
        await using var reader = await command.ExecuteReaderAsync(cancellationToken);

        var tasks = new List<TodoItem>();
        while (await reader.ReadAsync(cancellationToken))
        {
            tasks.Add(ReadTask(reader));
        }

        return tasks;
    }

    public async Task UpdateTaskAsync(TodoItem task, CancellationToken cancellationToken = default)
    {
        await EnsureInitializedAsync(cancellationToken);
        const string sql = """
            UPDATE admin_tasks
            SET title = @title,
                notes = @notes,
                assigned_to_person_id = @assigned_to_person_id,
                is_complete = @is_complete,
                updated_at = @updated_at
            WHERE id = @id;
            """;

        await using var connection = await OpenConnectionAsync(cancellationToken);
        await using var command = new NpgsqlCommand(sql, connection);
        AddTaskParameters(command, task);
        command.Parameters.AddWithValue("id", task.Id);
        await command.ExecuteNonQueryAsync(cancellationToken);
    }

    public async Task UpdateTaskCompletionAsync(long id, bool isComplete, CancellationToken cancellationToken = default)
    {
        await EnsureInitializedAsync(cancellationToken);
        const string sql = "UPDATE admin_tasks SET is_complete = @is_complete, updated_at = @updated_at WHERE id = @id;";

        await using var connection = await OpenConnectionAsync(cancellationToken);
        await using var command = new NpgsqlCommand(sql, connection);
        command.Parameters.AddWithValue("id", id);
        command.Parameters.AddWithValue("is_complete", isComplete);
        command.Parameters.AddWithValue("updated_at", DateTimeOffset.UtcNow);
        await command.ExecuteNonQueryAsync(cancellationToken);
    }

    public async Task DeleteTaskAsync(long id, CancellationToken cancellationToken = default)
    {
        await EnsureInitializedAsync(cancellationToken);
        await using var connection = await OpenConnectionAsync(cancellationToken);
        await using var command = new NpgsqlCommand("DELETE FROM admin_tasks WHERE id = @id;", connection);
        command.Parameters.AddWithValue("id", id);
        await command.ExecuteNonQueryAsync(cancellationToken);
    }

    public async Task<long> CreatePersonAsync(Person person, CancellationToken cancellationToken = default)
    {
        await EnsureInitializedAsync(cancellationToken);
        const string sql = """
            INSERT INTO admin_people (name, role, created_at, updated_at)
            VALUES (@name, @role, @created_at, @updated_at)
            RETURNING id;
            """;

        await using var connection = await OpenConnectionAsync(cancellationToken);
        await using var command = new NpgsqlCommand(sql, connection);
        AddPersonParameters(command, person);
        return (long)(await command.ExecuteScalarAsync(cancellationToken) ?? 0L);
    }

    public async Task<IReadOnlyList<Person>> ListPeopleAsync(CancellationToken cancellationToken = default)
    {
        await EnsureInitializedAsync(cancellationToken);
        const string sql = """
            SELECT id, name, role, created_at, updated_at
            FROM admin_people
            ORDER BY LOWER(name), id;
            """;

        await using var connection = await OpenConnectionAsync(cancellationToken);
        await using var command = new NpgsqlCommand(sql, connection);
        await using var reader = await command.ExecuteReaderAsync(cancellationToken);

        var people = new List<Person>();
        while (await reader.ReadAsync(cancellationToken))
        {
            people.Add(ReadPerson(reader));
        }

        return people;
    }

    public async Task UpdatePersonAsync(Person person, CancellationToken cancellationToken = default)
    {
        await EnsureInitializedAsync(cancellationToken);
        const string sql = """
            UPDATE admin_people
            SET name = @name,
                role = @role,
                updated_at = @updated_at
            WHERE id = @id;
            """;

        await using var connection = await OpenConnectionAsync(cancellationToken);
        await using var command = new NpgsqlCommand(sql, connection);
        AddPersonParameters(command, person);
        command.Parameters.AddWithValue("id", person.Id);
        await command.ExecuteNonQueryAsync(cancellationToken);
    }

    public async Task DeletePersonAsync(long id, CancellationToken cancellationToken = default)
    {
        await EnsureInitializedAsync(cancellationToken);
        const string sql = """
            UPDATE admin_tasks SET assigned_to_person_id = NULL, updated_at = @updated_at WHERE assigned_to_person_id = @id;
            DELETE FROM admin_people WHERE id = @id;
            """;

        await using var connection = await OpenConnectionAsync(cancellationToken);
        await using var command = new NpgsqlCommand(sql, connection);
        command.Parameters.AddWithValue("id", id);
        command.Parameters.AddWithValue("updated_at", DateTimeOffset.UtcNow);
        await command.ExecuteNonQueryAsync(cancellationToken);
    }

    public async Task<IReadOnlyList<RsvpSubmission>> ListAttendingGuestsAsync(CancellationToken cancellationToken = default)
    {
        await EnsureInitializedAsync(cancellationToken);
        const string sql = """
            SELECT id, full_name, attending, guest_count, dietary_notes, guest_message, admin_notes, admin_status,
                   submitted_at, updated_at, ip_address, user_agent, rejected_reason
            FROM rsvp_submissions
            WHERE attending = TRUE
            ORDER BY LOWER(full_name), id
            LIMIT 150;
            """;

        await using var connection = await OpenConnectionAsync(cancellationToken);
        await using var command = new NpgsqlCommand(sql, connection);
        await using var reader = await command.ExecuteReaderAsync(cancellationToken);

        var submissions = new List<RsvpSubmission>();
        while (await reader.ReadAsync(cancellationToken))
        {
            submissions.Add(ReadSubmission(reader));
        }

        return submissions;
    }

    public async Task<IReadOnlyList<SeatingLayoutPosition>> ListSeatingLayoutAsync(CancellationToken cancellationToken = default)
    {
        await EnsureInitializedAsync(cancellationToken);
        const string sql = """
            SELECT table_number, x_percent, y_percent, updated_at
            FROM seating_layout
            ORDER BY table_number;
            """;

        await using var connection = await OpenConnectionAsync(cancellationToken);
        await using var command = new NpgsqlCommand(sql, connection);
        await using var reader = await command.ExecuteReaderAsync(cancellationToken);

        var positions = new List<SeatingLayoutPosition>();
        while (await reader.ReadAsync(cancellationToken))
        {
            positions.Add(new SeatingLayoutPosition
            {
                TableNumber = reader.GetInt32(0),
                XPercent = reader.GetDecimal(1),
                YPercent = reader.GetDecimal(2),
                UpdatedAt = reader.GetFieldValue<DateTimeOffset>(3)
            });
        }

        return positions;
    }

    public async Task<IReadOnlyList<CreatedSeatingTable>> ListCreatedSeatingTablesAsync(CancellationToken cancellationToken = default)
    {
        await EnsureInitializedAsync(cancellationToken);
        const string sql = """
            SELECT table_number, created_at, updated_at
            FROM created_seating_tables
            ORDER BY table_number;
            """;

        await using var connection = await OpenConnectionAsync(cancellationToken);
        await using var command = new NpgsqlCommand(sql, connection);
        await using var reader = await command.ExecuteReaderAsync(cancellationToken);

        var tables = new List<CreatedSeatingTable>();
        while (await reader.ReadAsync(cancellationToken))
        {
            tables.Add(new CreatedSeatingTable
            {
                TableNumber = reader.GetInt32(0),
                CreatedAt = reader.GetFieldValue<DateTimeOffset>(1),
                UpdatedAt = reader.GetFieldValue<DateTimeOffset>(2)
            });
        }

        return tables;
    }

    public async Task CreateSeatingTableAsync(int tableNumber, CancellationToken cancellationToken = default)
    {
        await EnsureInitializedAsync(cancellationToken);
        const string sql = """
            INSERT INTO created_seating_tables (table_number, created_at, updated_at)
            VALUES (@table_number, @created_at, @updated_at)
            ON CONFLICT (table_number) DO UPDATE
            SET updated_at = EXCLUDED.updated_at;
            """;

        await using var connection = await OpenConnectionAsync(cancellationToken);
        await using var command = new NpgsqlCommand(sql, connection);
        command.Parameters.AddWithValue("table_number", tableNumber);
        command.Parameters.AddWithValue("created_at", DateTimeOffset.UtcNow);
        command.Parameters.AddWithValue("updated_at", DateTimeOffset.UtcNow);
        await command.ExecuteNonQueryAsync(cancellationToken);
    }

    public async Task SaveSeatingLayoutAsync(IReadOnlyList<SeatingLayoutPosition> positions, CancellationToken cancellationToken = default)
    {
        await EnsureInitializedAsync(cancellationToken);
        const string sql = """
            INSERT INTO seating_layout (table_number, x_percent, y_percent, updated_at)
            VALUES (@table_number, @x_percent, @y_percent, @updated_at)
            ON CONFLICT (table_number) DO UPDATE
            SET x_percent = EXCLUDED.x_percent,
                y_percent = EXCLUDED.y_percent,
                updated_at = EXCLUDED.updated_at;
            """;

        await using var connection = await OpenConnectionAsync(cancellationToken);
        await using var transaction = await connection.BeginTransactionAsync(cancellationToken);

        foreach (var position in positions)
        {
            await using var command = new NpgsqlCommand(sql, connection, transaction);
            command.Parameters.AddWithValue("table_number", position.TableNumber);
            command.Parameters.AddWithValue("x_percent", position.XPercent);
            command.Parameters.AddWithValue("y_percent", position.YPercent);
            command.Parameters.AddWithValue("updated_at", DateTimeOffset.UtcNow);
            await command.ExecuteNonQueryAsync(cancellationToken);
        }

        await transaction.CommitAsync(cancellationToken);
    }

    public async Task<IReadOnlyList<SeatingAssignment>> ListSeatingAssignmentsAsync(CancellationToken cancellationToken = default)
    {
        await EnsureInitializedAsync(cancellationToken);
        const string sql = """
            SELECT a.rsvp_submission_id, a.table_number, a.seat_number, r.full_name, a.updated_at
            FROM guest_seating_assignments a
            JOIN rsvp_submissions r ON r.id = a.rsvp_submission_id
            WHERE r.attending = TRUE
            ORDER BY a.table_number, a.seat_number;
            """;

        await using var connection = await OpenConnectionAsync(cancellationToken);
        await using var command = new NpgsqlCommand(sql, connection);
        await using var reader = await command.ExecuteReaderAsync(cancellationToken);

        var assignments = new List<SeatingAssignment>();
        while (await reader.ReadAsync(cancellationToken))
        {
            assignments.Add(new SeatingAssignment
            {
                RsvpSubmissionId = reader.GetInt64(0),
                TableNumber = reader.GetInt32(1),
                SeatNumber = reader.GetInt32(2),
                GuestName = reader.GetString(3),
                UpdatedAt = reader.GetFieldValue<DateTimeOffset>(4)
            });
        }

        return assignments;
    }

    public async Task SaveSeatingAssignmentAsync(SeatingAssignment assignment, CancellationToken cancellationToken = default)
    {
        await EnsureInitializedAsync(cancellationToken);
        const string sql = """
            INSERT INTO created_seating_tables (table_number, created_at, updated_at)
            VALUES (@table_number, @updated_at, @updated_at)
            ON CONFLICT (table_number) DO UPDATE
            SET updated_at = EXCLUDED.updated_at;

            DELETE FROM guest_seating_assignments
            WHERE table_number = @table_number
              AND seat_number = @seat_number
              AND rsvp_submission_id <> @rsvp_submission_id;

            INSERT INTO guest_seating_assignments (rsvp_submission_id, table_number, seat_number, updated_at)
            VALUES (@rsvp_submission_id, @table_number, @seat_number, @updated_at)
            ON CONFLICT (rsvp_submission_id) DO UPDATE
            SET table_number = EXCLUDED.table_number,
                seat_number = EXCLUDED.seat_number,
                updated_at = EXCLUDED.updated_at;
            """;

        await using var connection = await OpenConnectionAsync(cancellationToken);
        await using var command = new NpgsqlCommand(sql, connection);
        AddSeatingAssignmentParameters(command, assignment);
        await command.ExecuteNonQueryAsync(cancellationToken);
    }

    public async Task ClearSeatingAssignmentAsync(long rsvpSubmissionId, CancellationToken cancellationToken = default)
    {
        await EnsureInitializedAsync(cancellationToken);
        await using var connection = await OpenConnectionAsync(cancellationToken);
        await using var command = new NpgsqlCommand("DELETE FROM guest_seating_assignments WHERE rsvp_submission_id = @rsvp_submission_id;", connection);
        command.Parameters.AddWithValue("rsvp_submission_id", rsvpSubmissionId);
        await command.ExecuteNonQueryAsync(cancellationToken);
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

    private static void AddTaskParameters(NpgsqlCommand command, TodoItem task)
    {
        command.Parameters.AddWithValue("title", task.Title.Trim());
        command.Parameters.AddWithValue("notes", task.Notes.Trim());
        command.Parameters.AddWithValue("assigned_to_person_id", task.AssignedToPersonId.HasValue ? task.AssignedToPersonId.Value : DBNull.Value);
        command.Parameters.AddWithValue("is_complete", task.IsComplete);
        command.Parameters.AddWithValue("created_at", task.CreatedAt);
        command.Parameters.AddWithValue("updated_at", DateTimeOffset.UtcNow);
    }

    private static void AddPersonParameters(NpgsqlCommand command, Person person)
    {
        command.Parameters.AddWithValue("name", person.Name.Trim());
        command.Parameters.AddWithValue("role", person.Role.Trim());
        command.Parameters.AddWithValue("created_at", person.CreatedAt);
        command.Parameters.AddWithValue("updated_at", DateTimeOffset.UtcNow);
    }

    private static void AddSeatingAssignmentParameters(NpgsqlCommand command, SeatingAssignment assignment)
    {
        command.Parameters.AddWithValue("rsvp_submission_id", assignment.RsvpSubmissionId);
        command.Parameters.AddWithValue("table_number", assignment.TableNumber);
        command.Parameters.AddWithValue("seat_number", assignment.SeatNumber);
        command.Parameters.AddWithValue("updated_at", DateTimeOffset.UtcNow);
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

    private static TodoItem ReadTask(NpgsqlDataReader reader)
    {
        return new TodoItem
        {
            Id = reader.GetInt64(0),
            Title = reader.GetString(1),
            Notes = reader.GetString(2),
            AssignedToPersonId = reader.IsDBNull(3) ? null : reader.GetInt64(3),
            AssignedToName = reader.GetString(4),
            IsComplete = reader.GetBoolean(5),
            CreatedAt = reader.GetFieldValue<DateTimeOffset>(6),
            UpdatedAt = reader.GetFieldValue<DateTimeOffset>(7)
        };
    }

    private static Person ReadPerson(NpgsqlDataReader reader)
    {
        return new Person
        {
            Id = reader.GetInt64(0),
            Name = reader.GetString(1),
            Role = reader.GetString(2),
            CreatedAt = reader.GetFieldValue<DateTimeOffset>(3),
            UpdatedAt = reader.GetFieldValue<DateTimeOffset>(4)
        };
    }

    private static string Csv(string value)
    {
        var escaped = value.Replace("\"", "\"\"");
        return $"\"{escaped}\"";
    }
}

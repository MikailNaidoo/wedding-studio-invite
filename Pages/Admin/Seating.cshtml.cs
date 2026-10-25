using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.AspNetCore.Mvc.RazorPages;
using System.Globalization;
using System.Text;
using WeddingStudioInvite.Data;
using WeddingStudioInvite.Models;

namespace WeddingStudioInvite.Pages.Admin;

[Authorize]
public sealed class SeatingModel(IWeddingRepository repository) : PageModel
{
    public const int TableCount = 15;
    public const int SeatsPerTable = 10;

    public IReadOnlyList<SeatingTable> Tables { get; private set; } = [];
    public IReadOnlyList<CreatedSeatingTable> CreatedTables { get; private set; } = [];
    public IReadOnlyList<SeatingLayoutPosition> LayoutPositions { get; private set; } = [];
    public IReadOnlyList<RsvpSubmission> UnassignedGuests { get; private set; } = [];
    public string DatabaseStatusMessage { get; private set; } = "";

    [BindProperty]
    public SeatingAssignment Assignment { get; set; } = new();

    [BindProperty]
    public int NewTableNumber { get; set; } = 1;

    public int TableCountDisplay => TableCount;
    public int SeatsPerTableDisplay => SeatsPerTable;
    public int TotalSeats => TableCount * SeatsPerTable;
    public int AssignedGuestCount => Tables.Sum(table => table.Seats.Count(seat => seat.HasGuest));
    public IReadOnlyList<SeatingTable> AssignedTables => Tables.Where(table => table.AssignedSeatCount > 0).ToArray();
    public IReadOnlyList<SeatingTable> VisualizedTables
    {
        get
        {
            var createdTableNumbers = CreatedTables.Select(table => table.TableNumber).ToHashSet();
            return Tables
                .Where(table => createdTableNumbers.Contains(table.Number) || table.AssignedSeatCount > 0)
                .ToArray();
        }
    }

    public async Task OnGetAsync(CancellationToken cancellationToken)
    {
        IReadOnlyList<RsvpSubmission> guests;
        try
        {
            guests = await repository.ListAttendingGuestsAsync(cancellationToken);
            CreatedTables = await repository.ListCreatedSeatingTablesAsync(cancellationToken);
            LayoutPositions = await repository.ListSeatingLayoutAsync(cancellationToken);
            var assignments = await repository.ListSeatingAssignmentsAsync(cancellationToken);
            BuildSeatingPlan(guests, assignments);
        }
        catch (DatabaseUnavailableException)
        {
            CreatedTables = [];
            LayoutPositions = [];
            Tables = BuildEmptyTables();
            UnassignedGuests = [];
            DatabaseStatusMessage = "The guest database is not running. Start PostgreSQL with docker compose up -d, then refresh this page.";
        }
    }

    public async Task<IActionResult> OnPostAssignAsync(CancellationToken cancellationToken)
    {
        if (Assignment.RsvpSubmissionId <= 0 || Assignment.TableNumber is < 1 or > TableCount || Assignment.SeatNumber is < 1 or > SeatsPerTable)
        {
            TempData["ToastMessage"] = "Choose a guest, table, and seat before saving.";
            TempData["ToastTone"] = "danger";
            return RedirectToPage();
        }

        await repository.SaveSeatingAssignmentAsync(Assignment, cancellationToken);
        TempData["ToastMessage"] = "Guest seating assignment saved.";
        TempData["ToastTone"] = "success";
        return RedirectToPage();
    }

    public async Task<IActionResult> OnPostCreateTableAsync(CancellationToken cancellationToken)
    {
        if (NewTableNumber is < 1 or > TableCount)
        {
            TempData["ToastMessage"] = "Choose a table number between 1 and 15.";
            TempData["ToastTone"] = "danger";
            return RedirectToPage();
        }

        await repository.CreateSeatingTableAsync(NewTableNumber, cancellationToken);
        TempData["ToastMessage"] = $"Table {NewTableNumber} is now visible on the floor plan.";
        TempData["ToastTone"] = "success";
        return RedirectToPage();
    }

    public async Task<IActionResult> OnPostClearAssignmentAsync(long rsvpSubmissionId, CancellationToken cancellationToken)
    {
        if (rsvpSubmissionId > 0)
        {
            await repository.ClearSeatingAssignmentAsync(rsvpSubmissionId, cancellationToken);
        }

        TempData["ToastMessage"] = "Guest seating assignment cleared.";
        TempData["ToastTone"] = "success";
        return RedirectToPage();
    }

    public async Task<IActionResult> OnGetExportPdfAsync(CancellationToken cancellationToken)
    {
        try
        {
            var guests = await repository.ListAttendingGuestsAsync(cancellationToken);
            var assignments = await repository.ListSeatingAssignmentsAsync(cancellationToken);
            BuildSeatingPlan(guests, assignments);
        }
        catch (DatabaseUnavailableException)
        {
            return RedirectToPage();
        }

        var pdf = BuildSeatingPlanPdf(AssignedTables);
        return File(pdf, "application/pdf", "Mikail & Dershia Wedding Seating Plan.pdf");
    }

    private void BuildSeatingPlan(IReadOnlyList<RsvpSubmission> guests, IReadOnlyList<SeatingAssignment> assignments)
    {
        var assignedGuestIds = assignments.Select(assignment => assignment.RsvpSubmissionId).ToHashSet();
        var assignmentsBySeat = assignments.ToDictionary(
            assignment => (assignment.TableNumber, assignment.SeatNumber),
            assignment => assignment);

        Tables = Enumerable.Range(1, TableCount)
            .Select(tableNumber => new SeatingTable(
                tableNumber,
                Enumerable.Range(1, SeatsPerTable)
                    .Select(seatNumber =>
                    {
                        assignmentsBySeat.TryGetValue((tableNumber, seatNumber), out var assignment);
                        return new SeatingSeat(tableNumber, seatNumber, assignment?.GuestName ?? "", assignment?.RsvpSubmissionId);
                    })
                    .ToArray()))
            .ToArray();

        UnassignedGuests = guests
            .Where(guest => !assignedGuestIds.Contains(guest.Id))
            .OrderBy(guest => guest.FullName)
            .ToArray();
    }

    private static IReadOnlyList<SeatingTable> BuildEmptyTables()
    {
        return Enumerable.Range(1, TableCount)
            .Select(tableNumber => new SeatingTable(
                tableNumber,
                Enumerable.Range(1, SeatsPerTable)
                    .Select(seatNumber => new SeatingSeat(tableNumber, seatNumber, "", null))
                    .ToArray()))
            .ToArray();
    }

    public async Task<JsonResult> OnPostLayoutAsync([FromBody] SeatingLayoutRequest request, CancellationToken cancellationToken)
    {
        if (request.Positions.Count == 0)
        {
            return new JsonResult(new { ok = false, message = "No table positions were supplied." }) { StatusCode = 400 };
        }

        var positions = request.Positions
            .Where(position => position.TableNumber is >= 1 and <= TableCount)
            .Select(position => new SeatingLayoutPosition
            {
                TableNumber = position.TableNumber,
                XPercent = Clamp(position.XPercent),
                YPercent = Clamp(position.YPercent)
            })
            .ToArray();

        await repository.SaveSeatingLayoutAsync(positions, cancellationToken);
        return new JsonResult(new { ok = true, saved = positions.Length });
    }

    private static decimal Clamp(decimal value) => Math.Min(95m, Math.Max(0m, value));

    private static byte[] BuildSeatingPlanPdf(IReadOnlyList<SeatingTable> tables)
    {
        var writer = new SimplePdfWriter();
        writer.AddText(72, 742, "29.08.2027", 13, "F2", 0.6m);
        writer.AddText(72, 718, "MIKAIL & DERSHIA WEDDING", 14, "F2", 1.8m);
        const string pdfHeading = "SEATING PLAN";
        var headingParts = pdfHeading.Split(' ');
        writer.AddText(72, 640, headingParts[0], 58, "F1", 6m);
        writer.AddText(72, 570, headingParts[1], 58, "F1", 6m);

        var columnXs = new[] { 72, 250, 428 };
        const int firstRowY = 480;
        const int tableGap = 180;

        for (var index = 0; index < tables.Count; index++)
        {
            var column = index % 3;
            var row = index / 3;
            var x = columnXs[column];
            var y = firstRowY - (row * tableGap);
            if (y < 90)
            {
                break;
            }

            writer.AddLine(x - 24, y + 56, x - 24, y - 128);
            writer.AddText(x, y, $"TABLE {tables[index].Number}", 25, "F1", 2.5m);

            var guestY = y - 38;
            foreach (var seat in tables[index].AssignedSeats)
            {
                writer.AddText(x, guestY, seat.GuestName.ToUpperInvariant(), 9, "F2", 1.2m);
                guestY -= 17;
            }
        }

        return writer.Build();
    }
}

public sealed record SeatingTable(int Number, IReadOnlyList<SeatingSeat> Seats)
{
    public int AssignedSeatCount => Seats.Count(seat => seat.HasGuest);
    public IReadOnlyList<SeatingSeat> AssignedSeats => Seats.Where(seat => seat.HasGuest).ToArray();
}

public sealed record SeatingSeat(int TableNumber, int SeatNumber, string GuestName, long? RsvpSubmissionId)
{
    public int GlobalSeatNumber => ((TableNumber - 1) * SeatingModel.SeatsPerTable) + SeatNumber;
    public bool HasGuest => !string.IsNullOrWhiteSpace(GuestName);
    public string DisplayName => HasGuest ? GuestName : "Open seat";
}

public sealed class SeatingLayoutRequest
{
    public List<SeatingLayoutPositionInput> Positions { get; set; } = [];
}

public sealed class SeatingLayoutPositionInput
{
    public int TableNumber { get; set; }
    public decimal XPercent { get; set; }
    public decimal YPercent { get; set; }
}

internal sealed class SimplePdfWriter
{
    private readonly StringBuilder _content = new();

    public void AddText(int x, int y, string text, int size, string font, decimal letterSpacing)
    {
        _content.AppendLine("BT");
        _content.AppendFormat(CultureInfo.InvariantCulture, "/{0} {1} Tf\n", font, size);
        _content.AppendFormat(CultureInfo.InvariantCulture, "{0:0.###} Tc\n", letterSpacing);
        _content.AppendFormat(CultureInfo.InvariantCulture, "1 0 0 1 {0} {1} Tm\n", x, y);
        _content.Append('(').Append(Escape(text)).AppendLine(") Tj");
        _content.AppendLine("ET");
    }

    public void AddLine(int x1, int y1, int x2, int y2)
    {
        _content.AppendLine("0.65 w");
        _content.AppendFormat(CultureInfo.InvariantCulture, "{0} {1} m {2} {3} l S\n", x1, y1, x2, y2);
    }

    public byte[] Build()
    {
        var content = Encoding.ASCII.GetBytes(_content.ToString());
        var objects = new List<byte[]>
        {
            Encoding.ASCII.GetBytes("<< /Type /Catalog /Pages 2 0 R >>"),
            Encoding.ASCII.GetBytes("<< /Type /Pages /Kids [3 0 R] /Count 1 >>"),
            Encoding.ASCII.GetBytes("<< /Type /Page /Parent 2 0 R /MediaBox [0 0 612 792] /Resources << /Font << /F1 4 0 R /F2 5 0 R >> >> /Contents 6 0 R >>"),
            Encoding.ASCII.GetBytes("<< /Type /Font /Subtype /Type1 /BaseFont /Times-Roman >>"),
            Encoding.ASCII.GetBytes("<< /Type /Font /Subtype /Type1 /BaseFont /Helvetica >>"),
            Encoding.ASCII.GetBytes($"<< /Length {content.Length} >>\nstream\n{_content}endstream")
        };

        using var stream = new MemoryStream();
        WriteAscii(stream, "%PDF-1.4\n");
        var offsets = new List<long> { 0 };
        for (var index = 0; index < objects.Count; index++)
        {
            offsets.Add(stream.Position);
            WriteAscii(stream, $"{index + 1} 0 obj\n");
            stream.Write(objects[index]);
            WriteAscii(stream, "\nendobj\n");
        }

        var xrefOffset = stream.Position;
        WriteAscii(stream, $"xref\n0 {objects.Count + 1}\n");
        WriteAscii(stream, "0000000000 65535 f \n");
        foreach (var offset in offsets.Skip(1))
        {
            WriteAscii(stream, $"{offset:0000000000} 00000 n \n");
        }

        WriteAscii(stream, $"trailer\n<< /Size {objects.Count + 1} /Root 1 0 R >>\nstartxref\n{xrefOffset}\n%%EOF\n");
        return stream.ToArray();
    }

    private static string Escape(string value) => value.Replace("\\", "\\\\").Replace("(", "\\(").Replace(")", "\\)");

    private static void WriteAscii(Stream stream, string value)
    {
        stream.Write(Encoding.ASCII.GetBytes(value));
    }
}

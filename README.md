# Mikail & Dershia Wedding RSVP

ASP.NET Core single-page wedding RSVP app with PostgreSQL storage and an admin dashboard.

## Local Run

Start the local PostgreSQL database:

```bash
docker compose up -d
```

Then run the app:

```bash
export ConnectionStrings__DefaultConnection="Host=localhost;Port=5432;Database=wedding_rsvp;Username=postgres;Password=postgres"
export ADMIN_USERNAME="admin"
export ADMIN_PASSWORD="ChangeMeBeforeDeploying!"
/usr/local/share/dotnet/x64/dotnet run
```

Public invitation: `http://localhost:5147/`

Admin dashboard: `http://localhost:5147/admin`

Local development login:

- Username: `admin`
- Password: `ChangeMeBeforeDeploying!`

If you see `Connection refused` or `Failed to connect to 127.0.0.1:5432`, PostgreSQL is not running yet. Run:

```bash
docker compose up -d
```

## Azure Settings

For Azure App Service, add these application settings:

- `ADMIN_USERNAME`: admin login username.
- `ADMIN_PASSWORD`: strong admin password.
- `ConnectionStrings__DefaultConnection`: Azure Database for PostgreSQL connection string.

The app creates the `rsvp_submissions` table on startup if it does not already exist.

## RSVP Protection

The public RSVP form uses server-side spam checks:

- Hidden honeypot field.
- Minimum time before submission.
- Guest count bounds.
- Excess link detection.

## Admin Features

- Dark RSVP dashboard.
- Summary tiles for submissions, attending, not attending, pending, confirmed, dietary notes, and recent submissions.
- Search and filters.
- Create, edit, delete RSVP records.
- Inline Pending/Confirmed status updates.
- Admin notes and duplicate-name warnings.
- CSV export.

# Admin Tasks Design

## Goal

Add an admin-only to-do/tasks feature for wedding planning tasks, saved to the same PostgreSQL database as RSVP information.

## Scope

- Add a Tasks menu item in the dark Mazer admin sidebar.
- Add a new `/Admin/Tasks` page protected by admin login.
- Allow the admin to create, edit, mark complete/pending, and delete tasks.
- Persist tasks in PostgreSQL through `IWeddingRepository` and `WeddingRepository`.
- Use the same dark admin theme, modal style, and toast feedback patterns already used by the RSVP dashboard.

## Data Model

Tasks use a small `admin_tasks` table:

- `id`: database identity.
- `title`: required task name.
- `notes`: optional detail text.
- `is_complete`: saved completion state.
- `created_at`: UTC creation timestamp.
- `updated_at`: UTC update timestamp.

## Interaction Design

The Tasks page has one compact create form at the top and a dark table below it. Each task row has:

- A status badge for Pending or Complete.
- A button to toggle completion.
- An Edit button that opens a themed modal.
- A Delete button that opens a confirmation modal.

Successful actions show toast notifications.

## Error Handling

If PostgreSQL is unavailable, the Tasks page shows the same database guidance used on the admin dashboard and avoids implying the action was saved.

## Testing

Add static tests that verify:

- The task model, admin page, and page model exist.
- The repository creates the `admin_tasks` schema and exposes task CRUD methods.
- The admin sidebar links to `/Admin/Tasks`.
- The Tasks page uses the Mazer admin shell, modals, toasts, and task status toggle actions.

# Wedding RSVP v2 frontend port

The public interface is adapted directly from the generated files in
`/Users/mikailnaidoo/Documents/ChatGPT/Wedding RSVP v2`:

- `index.html` → static preview and `Pages/Index.cshtml`.
- `style.css` → `styles.css`.
- `script.js` → `app.js`.
- Assets are copied into `assets/v2/`; existing wedding artwork is preserved.

The v2 video intro, canvas globe, city film dialogs, tabbed details, music,
theme switch and device-local photo gallery are retained. The public interface is English-only;
the translation dictionary, language switch and translation attributes have been removed.
Names, wedding date, venue, schedule and RSVP deadline use this project's details.
The unrelated guest list was removed and unconfirmed menu details are marked pending.
The intro uses the user-supplied MP4 at `assets/hero-video.mp4`. Journey locations now show
Chatsworth, Durban, Drakensberg, Johannesburg, Port Shepstone and Bali. Their dialogs
show coordinates and an explicit pending-memories message; unrelated source films
are no longer associated with these places.

Location pins are representative points, not exact venues. Coordinate references:
- Chatsworth: https://www.statssa.gov.za/?id=10457&page_id=4286
- Durban: https://www.findlatitudeandlongitude.com/l/Durban/5747958/
- Drakensberg range: https://sahistory.org.za/place/drakensberg-mountain-range-lesotho
- Johannesburg: https://www.coordmap.com/cities/johannesburg
- Port Shepstone: https://ungegn.un.org/dashboard/cities/details?id=2740
- Bali island: https://www.latlong.net/place/bali-indonesia-3445.html

## Preview and production behavior

`npm start` serves the static preview on port 4180. Preview RSVPs use localStorage;
gallery photos use IndexedDB and are not shared with other guests.

The ASP.NET Razor page uses the same visual interface but retains the original
RSVP handler, anti-forgery token, spam guard, server validation and PostgreSQL
persistence. Its JavaScript does not intercept the server form submission.
Admin pages, models and repository behavior are unchanged by this port.

Use the HTTP preview rather than opening the HTML file directly.

## Verification

- `node --check app.js`
- `node --test site.test.mjs` (backend/admin contracts and asset integration)
- `dotnet build --no-restore`
- Browser checks: intro at 375px, globe, tabs, theme, music,
  gallery dialog and desktop server RSVP form with generated anti-forgery token.

Old source-pattern assertions requiring the replaced editorial layout were
removed. Existing backend/admin assertions remain.
No real RSVP was submitted during verification.

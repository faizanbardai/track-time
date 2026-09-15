# track-time

track time

Front end: Next.js

A SPA (Single Page Application) that shows time left or time since a specific date.

The application allows users to input a date and then displays a countdown timer or a count-up timer, depending on whether the date is in the future or the past. The data is saved locally in the browser's IndexedDB.

## Event dates and progress

- A single date counts down before the date and shows time since afterward.
- Enable **Include time** for precise times. Start and end can use different IANA timezones (for example, `Europe/Berlin`).
- **Add end date** creates an interval: countdown to start, time remaining while ongoing, and time since completion afterward. The total duration remains beneath the dates.
- Date-only ranges include both dates. August 10–16 is seven calendar days; the event finishes at the start of August 17 in the viewer's local timezone.
- Progress appears automatically during an interval and measures elapsed time between its start and end. Display units only control the counter's formatting.
- Enable **Show progress to next anniversary** for annual progress from a single date or, after an interval finishes, its selected end date. The bar resets each anniversary; February 29 uses February 28 in non-leap years. Timed anniversaries use the saved endpoint timezone.
- Existing timestamps remain timed events. Legacy single-date `progressEnabled` preferences enable anniversary progress unless explicitly overridden.

Date-only values are stored as `YYYY-MM-DD`; timed values are stored as UTC timestamps with their selected timezone metadata. Events and tags are stored locally in IndexedDB.

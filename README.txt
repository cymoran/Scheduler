ABA Weekly Scheduler Prototype — Version 2

HOW TO RUN
1. Extract the ZIP file.
2. Keep index.html, styles.css, and script.js in the same folder.
3. Open index.html in Chrome, Edge, or Firefox.

NEW IN VERSION 2
- Each client shows scheduled hours relative to required weekly hours.
- Progress bars indicate under target, target met, or over target.
- Combined weekly hours are summarized above the client list.
- Dragging now displays a full-color preview that snaps to 30-minute slots.
- The original appointment no longer turns gray while moving.
- The page is centered and capped at a practical desktop width.
- The calendar uses a viewport-height workspace with internal scrolling.
- The top date label is formatted as a weekly range and clearly labeled Week.
- Clear Schedule is now labeled Clear Week.

SESSION TRACKING
- Use the Notes button on any client session to record its RBT identifier,
  actual minutes, session notes, billing/non-billable notes, and whether
  session targets were met.
- Use Weekly summary to compare each client's actual time with their weekly
  target and review all notes for the displayed week.
- Use + Block time to reserve calendar time for billing, administration,
  meetings, or other non-client work. Click a blocked item to edit or delete it.
- Drag blocked-time items between days and times just like client sessions.
- Client sessions and blocked time can repeat weekly for 2 to 52 weeks. Open
  the item's details, choose Weekly, and select the total number of weeks.
- Repeated client sessions keep the schedule and RBT assignment, but each
  future session starts with blank actual-time and clinical-note fields.

SERVICE RULES AND TARGETS
- Use Rules in the top Create group to add reusable service types such as
  Supervision and Parent training.
- Use Edit on a client card to give that client a different weekly hour target
  for each service rule.
- Dropping a client onto the calendar now opens Session details immediately so
  the appointment can be categorized. The category can also be changed later
  with the Notes button.
- Client cards and the weekly summary show progress separately for every
  assigned service target.

MONTH VIEW
- Switch between Week and Month above the date.
- Month view shows one summary panel per week with each scheduled client,
  combined target progress, and an hour breakdown by service rule.
- Select a week's heading to open that week in the detailed calendar.

SMALL SCREENS
- The full page scrolls normally when the browser is too short to display the
  end of the workday. The calendar and client list no longer use separate
  vertical scrolling areas.

CLIENT AVAILABILITY AND QUICK DETAILS
- Edit a client and use the weekday checklist to mark the days they attend.
- New or moved sessions are rejected with a warning when dropped on one of
  that client's unavailable weekdays.
- Hover over a client card for half a second to see rule targets, available
  weekdays, scheduled progress, and notes grouped by weekday.
- Rule targets are stacked vertically on each client card with a separate
  progress bar for every service.
- Returning from Month view restores the last week that was open.

LIST-BASED SESSION NOTES
- Session notes use one continuous editor. Pressing Enter starts a new bullet,
  so no separate Add note action is required.
- Older paragraph-style notes are converted into list items when opened.
- Weekly summaries group note bullets into separate weekday sections instead
  of combining them into a long sentence.
- The Session details window scrolls internally when needed and keeps its
  Delete, Cancel, and Save actions pinned to the bottom.

IMPORTANT
This remains a local front-end prototype. Data is saved only in the current browser using localStorage. It does not yet have a backend, authentication, shared clinic database, or HIPAA controls.

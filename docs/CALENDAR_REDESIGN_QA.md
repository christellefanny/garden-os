# Calendar consolidation

Base: released main `87e075faf78b5ae3fe6b855822f072b5963b3cf3`.

## Changes

- Combined the botanical Calendar introduction and Today & this week into one panel. Next steps is now a native, closed-by-default disclosure with a compact summary, pending today/this-week count, and separately labeled earlier-task count.
- Matched the Next steps arrow to the unmodified native marker used by Planning overview. Both summaries now share the same padding, line height, content wrapper, and label layout (20px horizontal inset on desktop, 16px on mobile), fixing the previous 16px desktop and 4px mobile mismatch.
- Shortened visible Growing Calendar labels to Calendar. Internal destinations, URLs, local-storage keys, and data schemas remain unchanged.
- Moved Add reminder to the opposite end of the month/year toolbar, with wrapping rules for narrow screens.
- Removed the separate Plants & planting dates button and modal. Plant inclusion, indoor/outdoor settings, frost-date editing, and planning statistics now share the Planning overview & frost dates disclosure.
- Kept empty-calendar onboarding, task cards, weekly view, phone reminders, weekly email, and briefing paths. Planning save errors are visible in the consolidated disclosure.

## Verification

- All 316 unit tests passed, including eleven new direct component-handler tests covering structure, preserved settings/data, reminder dialog entry/save callback/reopening, month/year switching and interrupted weekly view, empty-calendar onboarding, storage failure, native disclosure structure, pending-only counts, count updates, zero/singular labels, shared native disclosure markers, and one shared desktop/mobile inset and label layout.
- Production Next.js build and TypeScript checks passed with loopback-only test configuration.
- ESLint passed with zero errors and five pre-existing warnings in FlowersPage, GardenWorkspace, and PhotoJournal.
- Diff whitespace and browser-runner syntax checks passed.
- The standalone HTML visual preview renders the actual component with production CSS and embedded artwork. It contains synthetic data and no connected controls or remote services. Its native Next steps and planning disclosures can be expanded for visual review.

## Interactive browser verification: passed

On 2026-11-08, `tests/calendar-redesign.browser.mjs` passed in Chromium for both guest and mock-account flows against the application code at `9f9cf228e3dc4e5ecfa731ec58a0db00e3490459`. The tested application files matched the local checkout by SHA-256. The runner used a loopback-only fixture backend and blocked non-loopback browser traffic. No production credentials, real user data, notifications, or public routes were used.

Verified:

- Closed/open native marker styles match, arrow origins and label left edges differ by less than 0.5px at 1440, 1024, 768, 390, and 320px widths, with matching padding and line height. Expanded Next steps preserves alignment.
- Next steps starts closed, remains a compact 54px row on desktop, supports Enter and Space, and updates its pending count after task completion and undo.
- Frost-date editing, plant inclusion, and indoor/outdoor settings save correctly and survive reload without changing existing reminders.
- Add reminder remains on the right of the desktop month toolbar. Opening, Escape dismissal, reopening, saving, and reloading work without duplicate reminders.
- Weekly-view dismissal restores the monthly view, month/year switching works, and Tasks/Calendar navigation supports Back/Forward without repeated Calendar clicks growing history.
- Planning controls, collapsed/expanded Next steps, and the calendar have no document overflow at all five viewport widths.
- Scoped automated axe checks found no WCAG 2 A/AA or 2.1 AA violations in the visible overview, planning summary, and toolbar in each of the four seasonal themes. No page errors occurred.

The browser suite exited successfully in 48.4 seconds. The temporary isolated environment was confirmed stopped after its 15-minute cap; it retained no public routes or persistent snapshot.

### Visual evidence

The desktop and mobile screenshots below were captured from the actual interactive Chromium run using synthetic fixture data. Both were visually inspected: the arrows and labels line up, the closed task count fits, and the reminder toolbar wraps cleanly on mobile. These are cropped review images, not a complete-page screenshot set.

- [Desktop, 1440px viewport](qa/calendar-redesign/desktop.webp)
- [Mobile, 390px viewport](qa/calendar-redesign/mobile.webp)
- [Browser run output](qa/calendar-redesign/browser.log)

Artifact transfer reached the sandbox timeout before the complete screenshot archive arrived. The full log and these two complete, decodable image files were recovered from the archive prefix. The archive-wide checksum was therefore not verified; the additional expanded and planning-detail captures were not retained for visual inspection. Their interaction, layout, and overflow assertions did pass in the browser run.

## Limits and release status

- Mock-account coverage does not validate the production Supabase backend, real account authentication, email delivery, or push delivery.
- Chromium was tested. Safari and Firefox were not tested.
- Automated accessibility checks were scoped to the visible changed regions; they are not a full accessibility audit.
- Existing browser selectors were updated for the visible Calendar rename, but the full historical browser suites were not rerun.
- No changes were published or pushed. The standalone HTML preview still matches the tested application code.

Do not deploy the local prebuilt output: it uses loopback fixture configuration. Rebuild in the intended deployment environment only after publication is approved.

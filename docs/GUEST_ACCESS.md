# Guest access

Visitors can choose Continue as guest from the welcome screen. Gardens and growing spaces (including their plant and log records) are saved under `garden-os-guest-data`; vault, calendar and layout records use the existing storage formats with the `guest` namespace. Guests never write to authenticated database tables.

A first-visit notice explains device-only storage, with a persistent Save to an account action. Dismissing the notice does not dismiss the persistent storage indicator. Clearing browser data removes guest records; guest records do not follow the user to another device.

Save to an account supports both sign-up and sign-in. Email confirmation leaves guest records intact. After authentication with the chosen email, the transfer preserves UUIDs, saves gardens before spaces, and merges state through the existing authenticated, version-checked state API. Existing account records are retained. Interrupted transfers show a retry screen; retries reuse IDs. The original guest records and any replaced local account state remain as recovery copies. No database schema change is needed.

Device-only weekly briefings use local records and explicitly omit live weather. Calendar tasks and reminders work locally; background phone delivery requires the existing signed-in notification service.

Validation: `npm test`, `npm run build`, and lint changed components. `node tests/guest.browser.mjs` exercises the visitor → garden → growing space → reload → interrupted account transfer → retry flow with isolated fixtures. It requires an installed Playwright Chromium browser.

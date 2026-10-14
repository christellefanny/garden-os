# Growing-space plant picker

The Add Plant form offers a native dropdown grouped into Your Plant Vault and Plant catalog. Vault varieties remain individually selectable. The catalog includes vegetables, flowers, herbs and fruit; custom names remain supported.

All categories appear together in the Choose a plant dropdown, alphabetically within each source. There are no separate category or search controls.

Choosing a Vault record preserves its shared identity. Choosing a catalog plant creates or reuses a Vault record through the existing connected-save flow, retaining category. Changing the variety creates/reuses the matching variety rather than attaching it to an unrelated existing record. Nothing is saved until Save Plant succeeds. No database schema migration or existing-data replacement is needed.

Verification: node tests/plant-picker.test.mjs; PLAYWRIGHT_CHROMIUM_EXECUTABLE=/tmp/garden-chromium node tests/plant-picker.browser.mjs after an isolated fixture build. The browser suite uses test-only data, checks the absence of category/search controls, all categories in both sources, saves and identity-preserving edits, desktop/mobile overflow and WCAG rules.

Also repairs a truncated SpaceEditor file in the incoming branch while retaining Grow Bag gallon sizing and restores its existing notes/photo fields. Space-dialog secondary labels now meet contrast checks.

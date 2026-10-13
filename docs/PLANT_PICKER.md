# Growing-space plant picker

The Add Plant form offers a searchable native dropdown grouped into Your Plant Vault and Plant catalog. Vault varieties remain individually selectable. The catalog includes vegetables, flowers, herbs and fruit; custom names remain supported.

Automatic category filtering prioritizes a recognizable bed name, then garden name, then the categories of active/planned plants. Unknown and mixed gardens show all plants. An explicit category override supports companion planting. Existing Other records are classified for filtering only when their name matches the catalog; no saved category is silently overwritten.

Choosing a Vault record preserves its shared identity. Choosing a catalog plant creates or reuses a Vault record through the existing connected-save flow, retaining category. Changing the variety creates/reuses the matching variety rather than attaching it to an unrelated existing record. Nothing is saved until Save Plant succeeds. No database schema migration or existing-data replacement is needed.

Verification: node tests/plant-picker.test.mjs; PLAYWRIGHT_CHROMIUM_EXECUTABLE=/tmp/garden-chromium node tests/plant-picker.browser.mjs after an isolated fixture build. The browser suite uses test-only data, checks automatic filtering, both sources, overrides, identity-preserving edits, desktop/mobile overflow and WCAG rules.

Also repairs a truncated SpaceEditor file in the incoming branch while retaining Grow Bag gallon sizing and restores its existing notes/photo fields. Space-dialog secondary labels now meet contrast checks.

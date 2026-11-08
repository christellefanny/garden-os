# Soil guidance browser verification

Verified on 2026-11-08 against base commit `95209bcaeaf995184e83dc2b20975e5dbb2cdbc0` plus the local soil-guidance changes. GitHub’s main ref and Vercel’s latest production metadata both confirmed this base; the shell Git mirror returned an older main ref and was not used to replace the Calendar redesign.

## Isolation and execution

- One explicitly approved, non-persistent Vercel sandbox, two vCPUs, 15-minute maximum. Actual duration: 839 seconds; stopped status was read back. No exposed routes or snapshot were created.
- A fresh production build ran on localhost only with dummy Supabase settings. Browser routes supplied synthetic account, garden, growing-space and storage responses; unknown APIs, external requests and writes were blocked.
- No real login, service credentials, production records, repository push or deployment.
- Reusable runner: `tests/vegetable-soil.browser.mjs`. Run against a localhost production build with dummy settings using `BASE_URL=http://127.0.0.1:3000 OUTPUT_DIR=/tmp/soil-browser node tests/vegetable-soil.browser.mjs`. `TEST_FILTER` can select scenario names. The script starts no servers and rejects non-local targets.

## Final results

- 11 of 11 scenarios passed.
- 156 crop checks: every one of the 26 picker vegetables, in account and guest mode, at 1440, 390 and 320 pixels. Exact bed/container/moisture copy, optional or absent pH, source links, reset state and unchanged quantity were asserted.
- 44 accessibility scan configurations; no new-feature violations or unresolved classification findings. Both whole-screen and feature-scoped axe checks ran, with a same-screen baseline hiding the feature when unrelated violations appeared.
- All four seasonal themes passed at desktop and mobile widths, including keyboard focus visibility and outline contrast.
- No horizontal overflow in the inspected page, dialog or cards. Guidance controls met the 44-pixel minimum height. Captured desktop and mobile viewport screenshots were visually reviewed.
- No page errors, console errors or unexpected network requests in the final run.
- Final production build and 332 automated tests passed. Local TypeScript, focused lint and whitespace checks passed. Full lint retains the five previously recorded warnings, with no errors.

## Functional coverage

1. Account Plant Vault: keyboard open/close, crop details, sources, optional disclosure, focus return, aliases, unsupported vegetable and non-vegetable suppression. Guest Vault gating remains intact.
2. Account and guest spaces: all catalog crops, method toggles that do not submit or alter fields, save, edit, stable plant/Vault identity and reload persistence. Guest writes stay local.
3. Raised/in-ground beds, containers, current/legacy grow-bag names, unknown methods and hydroponic spaces. Unsupported vegetable remains saveable; unrelated flower/herb advice is suppressed.
4. Planner crop and space changes, including two spaces of the same type, custom dimensions, collapsed disclosure resets and handoff to the correct unsaved add-plant form.
5. All five public beginner vegetable cards, unique IDs, nested native disclosures, no login requirement and the existing guide popup without a nested dialog.

## Fix made during verification

The original new-card secondary text measured 4.45:1 against its tinted background, slightly below the 4.5:1 AA threshold. The card now derives a darker secondary color from the foreground and surface. The complete final browser suite passed after rebuilding and restarting the server.

An intermediate rerun hit an old server process after the build changed. It was stopped, the final build was started cleanly, and the complete suite reran successfully. Those infrastructure failures are not reported as app passes.

## Existing unrelated finding

The public guide’s checklist-storage explanation (outside the soil cards) measures 4.48:1 at 12px. The same issue appeared at all three widths and persisted with the new cards hidden. This is one existing issue, not three separate defects. No unrelated CSS was changed.

## Limits

Chromium desktop/mobile viewports were tested, not physical phones, Safari, Firefox, screen-reader speech or real authentication/cloud services. Source URLs and accessible link names were checked in the DOM; this isolated test did not visit external horticultural sources. The source research is recorded separately.

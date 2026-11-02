# Garden Vision Board

A dedicated `?view=vision-board` page, available in account and guest navigation. It uses the existing private photo gallery for uploaded pictures and screenshots, collections, titles, notes, categories, search, full-size viewing, bulk moves, and picture deletion.

## Storage and preservation

Inspiration entries and folders carry `collection: "inspiration"`. Existing untagged progress photos retain their original behavior and associations. The shared gallery filters on owner, collection and optional garden ID, so inspiration is excluded from the general Photo Journal and per-garden albums. Inspiration cannot be attached to an actual garden ID in cloud validation. No existing records are rewritten or migrated. The existing guest-to-account copy preserves the optional collection tag through object spreads.

Original images remain in IndexedDB with existing transaction semantics. Signed-in uploads use authenticated `/api/photos` requests, private Supabase storage and account-scoped metadata with optimistic version checks. Successful upload metadata retains the collection marker. New browser contexts download the private originals through signed URLs. Guests do not make cloud writes. Failed upload keeps the device copy and exposes the existing retry backup action. The existing server connection (`SUPABASE_SERVICE_ROLE_KEY`) is required for actual cloud image upload/download; no production secrets were copied into Preview.

No samples, shared inspiration library, chat attachments, external image downloads or actual user garden records are inserted. The decorative header reuses the approved courtyard watercolor; all saved inspiration pictures are explicitly uploaded by the user. Pictures are private rather than published.

## Validation

Unit coverage verifies backward compatibility, collection validation, account boundaries and progress/inspiration isolation. The isolated browser workflow uploads progress and inspiration photos, creates a collection, edits notes and titles, searches, opens the full-size viewer, checks the Photo Journal, downloads the cloud collection in a clean browser, deletes and reloads, and checks guest isolation/persistence at 390 pixels. Existing per-garden gallery regression checks remain applicable. All test accounts, server credentials and uploads are fixtures.

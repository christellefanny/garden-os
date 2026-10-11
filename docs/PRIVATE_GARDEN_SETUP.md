# Private Garden OS setup

This preview adds sign-in and garden ownership in preparation for future sharing. It uses your current Supabase project; there is no paid AI or extra database dependency.

## One-time setup

1. In Supabase **Authentication → URL Configuration**, set **Site URL** to the Garden OS preview URL and add that exact URL to **Redirect URLs**. This makes confirmation and password-reset links return to the app. For a later production release, update these to the approved production domain.
2. Open the preview, choose **Create an account**, and use the email you want to own your existing gardens. Confirm the email if Supabase requests it.
3. Open `supabase/private-gardens.sql`. Replace `YOUR_SIGN_IN_EMAIL` with the account email from step 2.
4. In your project's **SQL Editor**, create a new query, paste the script, review it, and run it.
5. Sign in to Garden OS. Your existing gardens are assigned to this account; their spaces and notes are retained.

The script adds `gardens.user_id`, assigns existing unowned gardens to your account, enables RLS, removes anonymous table access, and grants authenticated users only select/insert/update access. Restrictive ownership policies enforce privacy even if older permissive policies exist. The script does not delete your data. If the email does not match an account, the transaction rolls back.

An exact temporary verification garden remains because the existing public key has no delete permission. The final commented SQL lines can remove that test garden only. Review and uncomment those lines if desired.

## What is saved where

- Gardens and growing spaces: existing Supabase tables.
- Plant records and activity logs: versioned JSON inside each space's existing `notes` column. Original free-text notes are preserved as `notes` in that envelope. A future normalized migration can extract these arrays without losing them.
- Manual theme, chosen garden, and seasonal checklist ticks: browser storage. Checklists are keyed by account, garden, and season. They do not sync across devices.
- Export backup: downloadable JSON containing the selected garden and all its spaces, including archived spaces, plants, and logs. Export is currently a backup/download feature; import is not implemented.

## Scope

The personal garden foundation is implemented: accounts, garden create/edit/switch, spaces create/edit/archive/restore, plant create/edit/remove/status, capacity estimates, planner, activity logs, seasonal themes/checklists, and backup export.

Future sharing still requires invitation permissions and a complete two-account RLS test on the live database. Do not publicize the app before applying the private setup and verifying account isolation. Weather, AI diagnosis, seed inventory, photos, and shared-garden invitations remain separate roadmap features.

The crop-aware and growing-bag updates received during development are retained: editable crop spacing presets, rectangular and round estimates, and a manual review/import flow for earlier browser-only spaces. Original browser storage is never deleted. Capacity review starts at 75%; text labels accompany warning colors.

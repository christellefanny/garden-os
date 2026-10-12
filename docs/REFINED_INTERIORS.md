# Refined Garden OS interiors

The inner pages now use a shared Modern Conservatory page structure, rather than retaining the old dashboard/form arrangement.

- My Gardens: actual-data summary, focused garden selector, illustrated growing-space cards and one Journal destination. Duplicate planner promotion and activity feed removed; existing planner remains in the toolbar. Legacy-space recovery is collapsed.
- Plant Vault: five-column desktop botanical collection, independent category/status filtering, alphabetical order and a light-dismiss collection-tools popover. Notes, sources and full statuses remain in plant detail. Backup/import stays available without occupying the collection page.
- Garden Layout: saved layouts become a horizontal switcher. The map and bed detail panel are the primary workspace; duplicate nested navigation is removed. Original nine beds, custom layout editing, renaming, colors and space links are preserved.
- Growing Calendar: actual month/day grid with task counts and date filtering, grouped agenda, readable frost anchors, and a planning-settings dialog. Phone delivery and reminder creation remain available in Add reminder.
- Tasks: Today, This week and Upcoming views; categories consolidate matching activities while keeping individual completion controls and saved-reminder/recommendation labels.
- Journal: chronological season history and harvest comparisons; a focused Add entry dialog displays harvest fields only for harvests.
- Settings: account, cloud storage, appearance and phone-reminder cards. Backup/recovery tools are secondary. Growing-space detail separates Plants and Garden Log, with the capacity calculation available on demand.

No database schema or saved records were changed by this UI work. Existing Supabase sync, local migration backups, user authentication, garden/space records, plant entries, layouts and reminders remain in place.

Validation: 30 unit/database tests; clean lint; Next.js build; browser integration for linked plants, harvest logging, two-session cloud persistence, combined filters, light-dismiss collection tools, month filtering and planning settings. All interior pages are checked with Axe WCAG A/AA on desktop and mobile, and for overflow at 320, 390 and 768px. Layout builder coverage includes mouse, keyboard, touch, rename/switch and original-bed preservation. Screenshots use isolated QA records.

# Move a Plant Vault collection

Plant Vault entries currently live in browser storage scoped to your account and the page's origin. Resetting a password does not transfer them between preview and production URLs. The `utm_source` query parameter does not affect storage.

1. Open the older Garden OS link in the browser where the plants are visible. Open Plant Vault and choose **Export Plant Vault**.
2. Open `https://garden-os-beta.vercel.app` in that browser and sign in to the same account.
3. Open Plant Vault, choose the downloaded `garden-os-plant-vault.json` under **Import Plant Vault**, review the count and choose **Import collection**.

The export includes every record, not just the filtered view. The source collection is untouched. Import combines entries by plant name and variety, retains existing nonempty details, combines notes and statuses, and avoids duplicates on repeat imports. ID collisions between different plants receive a new ID. Invalid files are rejected before any records change. A copy of the destination collection is saved in browser storage under its `-before-import` key before importing. Storage failures are reported rather than treated as success.

This transfer is manual; it does not enable automatic cloud synchronization across devices or domains.

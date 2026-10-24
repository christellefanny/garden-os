# Illustrated Plant Vault

The collection uses original watercolor and colored-pencil botanical illustrations on white, with realistic foliage, distinct plant forms, and coordinated natural colors. Existing saved image URLs take priority. Only Plant Vault cards and their detail views use these new defaults; records and synchronization are unchanged.

Eight raster atlases live in `public/plant-vault/illustrated-collection-1.webp` through `illustrated-collection-8.webp`. The first seven have sixteen square cells; the eighth has four cells, with three in use. `lib/vault-botanical-art.ts` records the exact subjects in reading order. Unknown cultivars keep the existing fallback rather than borrowing a different cultivar's colors.

## Artwork production

Created with the built-in image-generation tool, using the owner's approved seed illustration references for style. Shared prompt: professional seed-catalog botanical watercolor and precise colored-pencil detail; realistic organic foliage and plant forms; subtle painterly texture; natural pigments; pure white background; separate centered specimens in equal invisible square cells; no photography, cartoons, text, labels, prices, quantities, seed packets, gridlines, or decorative borders. Subjects were specified in row-major order, matching the checked-in subject manifest.

Plate-specific instructions preserve creamy white marigolds; red, pink-red and dusky purple tomatoes; orange habanero and bonnet-shaped peppers; green serrano and jalapeno peppers; pale yellow Hungarian wax peppers; red cayenne; green versus red lettuces, onions and cabbages; pink hydrangea; silver-veined Jack Frost brunnera; and magenta Paint the Town dianthus. Generic flower and seed mixes are representative plant forms rather than a promise of exact mix contents.

Original generated PNGs are retained in the creation workspace. WebP exports preserve the complete atlas composition without redrawing or editing the artwork. Individual specimens are displayed through square, clipped image viewports rather than separate duplicated downloads.

## Verification

Check both In My Vault and Wishlist, approved custom image precedence, exact cultivar matching, all eight asset paths, desktop/tablet/mobile layouts, modal details, and persistence after reload. The change requires no database migration or user-data import.

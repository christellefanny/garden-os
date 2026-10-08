# Plant Vault artwork

The approved realistic botanical style uses five locally hosted WebP atlases, each containing sixteen square images. These are AI-generated representative illustrations, not cultivar-identification photographs. Cards disclose that varieties may differ. Personal photograph URLs take precedence; failed personal photos fall back to the botanical art. Unknown plants receive a neutral leaf placeholder.

`lib/plant-art.ts` defines row-major tile order and name aliases. All 79 distinct starter plant names have artwork, with an additional orange hot-pepper tile for Habanero and Scotch Bonnet. Artwork is lazy-loaded through Next Image. Existing records, storage keys and garden APIs are preserved.

Generation direction: realistic botanical photography appearance, natural garden light, correct leaves, fruits and flowers, healthy close-up specimens, quiet natural bokeh, consistent framing; exactly four columns and four rows with no gaps, borders, labels, text or people. Each atlas follows the ordered subjects in the mapping. Images are representative and must not be used to diagnose a plant or verify a cultivar.

/** Botanical life cycle and garden use are separate facts, not keyword guesses. */
export type PlantLifecycle = 'annual' | 'biennial' | 'perennial';
export type FlowerCornerClassification = {
  botanicalLifecycles: readonly PlantLifecycle[];
  grownAsAnnual: boolean;
  label: string;
  note: string;
  sourceUrls: readonly string[];
};
type ProfileIdentity = { id: string } | string;
const nc = (slug: string) => `https://plants.ces.ncsu.edu/plants/${slug}/`;
const annual = (slug: string, note = 'Completes its life cycle in one growing season; self-sown seedlings are new plants.'): FlowerCornerClassification => ({
  botanicalLifecycles: ['annual'], grownAsAnnual: false, label: 'Annual', note, sourceUrls: [nc(slug)],
});
const perennial = (slug: string, note = 'A perennial where its hardiness and growing conditions are suitable; the label is not a local winter-survival guarantee.'): FlowerCornerClassification => ({
  botanicalLifecycles: ['perennial'], grownAsAnnual: false, label: 'Perennial', note, sourceUrls: [nc(slug)],
});
const tender = (slug: string, note: string): FlowerCornerClassification => ({
  botanicalLifecycles: ['perennial'], grownAsAnnual: true, label: 'Tender perennial · grown as annual', note, sourceUrls: [nc(slug)],
});
const mixed = (botanicalLifecycles: readonly PlantLifecycle[], label: string, note: string, sourceUrls: readonly string[], grownAsAnnual = true): FlowerCornerClassification => ({
  botanicalLifecycles, grownAsAnnual, label, note, sourceUrls,
});

export const flowerCornerClassifications: Record<string, FlowerCornerClassification> = {
  dahlias: tender('dahlia', 'A tuberous perennial. Bedding plants may be grown for one season; retained tubers need suitable winter protection or storage.'),
  zinnias: annual('zinnia-elegans'),
  cosmos: annual('cosmos-bipinnatus'),
  marigolds: annual('tagetes', 'This entry covers common French, African and signet bedding marigolds, not perennial woody Tagetes species.'),
  snapdragons: tender('antirrhinum-majus', 'Antirrhinum majus is short-lived and perennial in suitable mild conditions, but is commonly used as an annual bedding or cutting crop.'),
  alyssum: mixed(['annual', 'perennial'], 'Annual / short-lived perennial', 'Lobularia maritima can be annual or short-lived perennial; climate and selection determine persistence.', [nc('lobularia-maritima')]),
  calendula: annual('calendula-officinalis'),
  sunflowers: annual('helianthus-annuus', 'Helianthus annuus is annual; perennial sunflower species are outside this profile.'),
  lisianthus: mixed(['annual', 'biennial', 'perennial'], 'Annual / biennial / short-lived perennial', 'Lisianthus is usually cultivated as an annual; botanical descriptions also include biennial and short-lived perennial behavior in suitable climates.', [nc('eustoma-grandiflorum')]),
  rudbeckia: mixed(['annual', 'biennial', 'perennial'], 'Annual / biennial / short-lived perennial', 'Rudbeckia hirta can follow all three life cycles. It is not interchangeable with longer-lived R. fulgida.', [nc('rudbeckia-hirta'), 'https://plants.usda.gov/DocumentLibrary/plantguide/pdf/pg_ruhi2.pdf']),
  heuchera: perennial('heuchera-americana', 'Heuchera species and garden hybrids are perennials; evergreen foliage and winter survival vary with selection and site.'),
  hosta: perennial('hosta'),
  statice: mixed(['annual', 'biennial', 'perennial'], 'Annual / biennial / short-lived perennial', 'Limonium sinuatum is often treated as an annual cutting crop, but can persist as a short-lived perennial or be grown as a biennial.', [nc('limonium-sinuatum')]),
  strawflower: mixed(['annual', 'perennial'], 'Annual / tender short-lived perennial', 'Xerochrysum bracteatum includes annual and short-lived perennial forms; garden crops are often grown for one season.', [nc('xerochrysum-bracteatum')]),
  gomphrena: annual('gomphrena-globosa', 'Gomphrena globosa is annual; other Gomphrena species should not inherit this life-cycle label.'),
  celosia: annual('celosia-argentea'),
  amaranth: annual('amaranthus-caudatus'),
  nigella: annual('nigella-damascena'),
  scabiosa: mixed(['annual', 'biennial', 'perennial'], 'Annual / biennial / short-lived perennial', 'Scabiosa atropurpurea is commonly annual in cultivation; RHS includes biennial behavior and NC State notes perennial persistence in mild sites.', [nc('scabiosa-atropurpurea'), 'https://www.rhs.org.uk/plants/30525/scabiosa-atropurpurea/details']),
  'ammi-majus': annual('ammi-majus'),
  bupleurum: { ...annual('bupleurum-rotundifolium'), sourceUrls: ['https://www.johnnyseeds.com/growers-library/flowers/bupleurum/bupleurum-key-growing-information.html'] },
  orlaya: { ...annual('orlaya-grandiflora'), sourceUrls: ['https://www.rhs.org.uk/plants/24959/orlaya-grandiflora/details/'] },
  'bells-of-ireland': annual('moluccella-laevis'),
  larkspur: { ...annual('consolida-ajacis', 'Annual larkspur is distinct from perennial delphiniums; autumn sowing does not turn it into a perennial.'), sourceUrls: ['https://blogs.cornell.edu/hightunnels/flowers/cut-flowers/cut-flower-crops/larkspur/'] },
  'bachelors-buttons': annual('centaurea-cyanus'),
  'sweet-peas': annual('lathyrus-odoratus', 'Lathyrus odoratus is annual; perennial everlasting peas are different species.'),
  nasturtium: mixed(['annual', 'perennial'], 'Annual / tender short-lived perennial', 'Garden nasturtiums are usually annual crops, but Tropaeolum majus can persist as a short-lived perennial in mild conditions.', [nc('tropaeolum-majus'), 'https://nathistoc.bio.uci.edu/plants/Tropaeolaceae/Tropaeolum%20majus.htm']),
  'chantilly-snapdragons': tender('antirrhinum-majus', 'The Chantilly F1 series is cultivated as an annual cutting crop; its Antirrhinum majus parent species is a tender, short-lived perennial.'),
  'rudbeckia-sahara': mixed(['biennial', 'perennial'], 'Short-lived perennial / biennial · grown as annual', 'Sahara is a Rudbeckia hirta selection grown for first-season flowers. Survival beyond that season varies; do not promise a lasting clump.', [nc('rudbeckia-hirta'), 'https://www.johnnyseeds.com/flowers/rudbeckia-black-eyed-susan/sahara-rudbeckia-seed-4125.html']),
  pansies: mixed(['annual', 'perennial'], 'Annual / short-lived perennial', 'Hybrid bedding pansies are commonly grown as cool-season annuals. Some persist briefly; heat and cultivar strongly affect longevity.', [nc('viola-x-wittrockiana'), 'https://class.ucanr.edu/sites/default/files/2025-04/FactSheet_Flower_Pansy_2021.02.14.pdf']),
  violas: mixed(['annual', 'biennial', 'perennial'], 'Annual / biennial / perennial · species varies', 'V. cornuta is perennial. V. tricolor can be annual, biennial or short-lived perennial; bedding hybrids vary. Check the botanical name.', [nc('viola-cornuta'), nc('viola-tricolor')]),
  daffodils: { ...perennial('narcissus', 'Bulb-forming perennials; suitable hardiness, drainage and retained green leaves are necessary for repeat flowering.'), label: 'Bulb perennial' },
  yarrow: perennial('achillea-millefolium'),
  astrantia: { ...perennial('astrantia-major'), sourceUrls: ['https://www.rhs.org.uk/plants/1870/astrantia-major/details'] },
  'china-asters': annual('callistephus-chinensis', 'China aster is annual; it is not the same plant as a returning perennial aster clump.'),
  'perennial-asters': { ...perennial('symphyotrichum', 'The species included in this entry are perennials; hardiness and habit still require a species or cultivar name.'), sourceUrls: ['https://www.chicagobotanic.org/plant-information/plant-profiles/aster'] },
  feverfew: { ...perennial('tanacetum-parthenium', 'A short-lived perennial; self-seeding can replace older plants, and some cutting systems grow it for a single crop.'), label: 'Short-lived perennial' },
  hydrangeas: { ...perennial('hydrangea-paniculata', 'These are woody perennial shrubs. Species and flowering wood determine pruning; a perennial filter does not imply cutting to ground.'), label: 'Woody perennial', sourceUrls: [nc('hydrangea-paniculata'), nc('hydrangea-macrophylla')] },
  ranunculus: tender('ranunculus-asiaticus', 'Ranunculus asiaticus is a tuberous-rooted perennial often cultivated as a seasonal crop. Dormancy and winter survival depend on local conditions.'),
  dianthus: mixed(['annual', 'biennial', 'perennial'], 'Annual / biennial / perennial · species varies', 'Dianthus includes all three life cycles. Sweet William, carnations and perennial pinks need species-specific expectations.', [nc('dianthus')], false),
  'japanese-anemone': perennial('eriocapitella-x-hybrida'),
  astilbe: { ...perennial('astilbe'), sourceUrls: ['https://yardandgarden.extension.iastate.edu/how-to/growing-astilbe-iowa'] },
  catmint: perennial('nepeta-x-faassenii'),
  tulips: { ...perennial('tulipa', 'Bulb-forming perennials, although many garden hybrids flower less reliably in later years and are grown as one-season displays.'), label: 'Bulb perennial · often grown as annual', grownAsAnnual: true },
  'ornamental-alliums': { ...perennial('allium', 'The ornamental bulbs and perennial alliums in this entry return where conditions suit; retained green leaves support the following season.'), label: 'Bulb / herbaceous perennial' },
  'japanese-painted-fern': perennial('athyrium-niponicum-var-pictum', 'A deciduous perennial fern. It returns from a surviving rhizome and never produces flowers or seeds.'),
  'autumn-fern': perennial('dryopteris-erythrosora', 'A perennial fern, evergreen or semi-evergreen by climate. Check local naturalization and invasive-plant guidance before planting.'),
  brunnera: perennial('brunnera-macrophylla'),
  pulmonaria: perennial('pulmonaria-saccharata'),
  bergenia: perennial('bergenia-crassifolia'),
  ligularia: { ...perennial('ligularia-dentata'), sourceUrls: ['https://www.rhs.org.uk/plants/10083/ligularia-dentata/details'] },
  tiarella: perennial('tiarella-cordifolia'),
  'bleeding-heart': perennial('lamprocapnos-spectabilis', 'A herbaceous perennial that often goes dormant in summer. Dormancy does not make it an annual.'),
  hellebores: perennial('helleborus-x-hybridus'),
  coleus: tender('coleus-scutellarioides', 'A tropical perennial commonly replaced each year outdoors where frost occurs. Protected plants or cuttings can be overwintered.'),
};

export const plantLifecycleOptions: ReadonlyArray<{ value: PlantLifecycle; label: string }> = [
  { value: 'annual', label: 'Annuals' },
  { value: 'biennial', label: 'Biennials' },
  { value: 'perennial', label: 'Perennials' },
];

export function getPlantClassification(profile: ProfileIdentity): FlowerCornerClassification | undefined {
  const id = typeof profile === 'string' ? profile : profile.id;
  return Object.hasOwn(flowerCornerClassifications, id) ? flowerCornerClassifications[id] : undefined;
}

/** Annual filter includes plants commonly grown as annuals, with an explicit label. */
export function getPlantLifecycles(profile: ProfileIdentity): PlantLifecycle[] {
  const classification = getPlantClassification(profile);
  if (!classification) return [];
  const values = new Set(classification.botanicalLifecycles);
  if (classification.grownAsAnnual) values.add('annual');
  return plantLifecycleOptions.map(option => option.value).filter(value => values.has(value));
}

export function getPlantLifecycleLabel(profile: ProfileIdentity): string {
  return getPlantClassification(profile)?.label ?? 'Life cycle not yet classified';
}

export function matchesPlantLifecycle(profile: ProfileIdentity, lifecycle: PlantLifecycle | 'all'): boolean {
  return lifecycle === 'all' || getPlantLifecycles(profile).includes(lifecycle);
}

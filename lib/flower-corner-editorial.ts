// Public editorial content only. Never derive these entries from account records.
// Adapted from the existing Blooms guides; seasonal examples describe cold-winter gardens.
export const cornerCareGuides = [
  { name:"Dianthus", light:"Full sun", care:"Water at soil level and remove faded flowers. Keep crowns above wet soil; trim lightly after the main flush.", bloom:"Spring into summer" },
  { name:"Hydrangea", light:"Morning sun / afternoon shade", care:"Water deeply during dry spells. Pruning depends on the variety: Limelight blooms on new wood; many bigleaf types bloom on old wood.", bloom:"Summer to fall" },
  { name:"Zinnia", light:"Full sun", care:"Sow after frost, space for airflow, and cut flowers regularly. Avoid overhead watering to limit powdery mildew.", bloom:"Summer to frost" },
  { name:"Cosmos", light:"Full sun", care:"Sow after frost. Avoid rich fertilizer; deadhead for more blooms and leave a few seedheads to collect.", bloom:"Summer to frost" },
  { name:"Marigold", light:"Full sun", care:"Plant after frost and deadhead regularly. Water the roots rather than the foliage.", bloom:"Summer to frost" },
  { name:"Calendula", light:"Sun to part shade", care:"Enjoy in cool weather; remove spent blooms. Heat may slow flowering, but plants can rebound in fall.", bloom:"Spring and fall" },
  { name:"Ranunculus", light:"Full sun in cool weather", care:"Grow for cool spring flowers. Protect corms from prolonged freezing and wet winter soil in cold climates.", bloom:"Spring" },
  { name:"Japanese Anemone", light:"Part shade", care:"Keep evenly moist while establishing and mulch lightly. Allow space: established plants can spread.", bloom:"Late summer to fall" },
  { name:"Astilbe", light:"Part shade", care:"Keep soil consistently moist; dry conditions scorch foliage and reduce flowers.", bloom:"Summer" },
  { name:"Catmint", light:"Full sun", care:"Shear back after the first flowering for tidy foliage and a possible second flush.", bloom:"Late spring to summer" },
  { name:"Tulip", light:"Full sun in spring", care:"Plant bulbs in fall in well-drained soil. Leave leaves until they yellow naturally.", bloom:"Spring" },
  { name:"Allium", light:"Full sun", care:"Plant bulbs in fall with good drainage. Leave flowerheads standing for structure or cut once dry.", bloom:"Late spring to early summer" },
];
export const cornerSeasons: Record<string,{title:string;tasks:string[]}> = {
  spring:{title:"Wake up the flower garden",tasks:["Remove winter debris gradually, checking for emerging perennials.","Plant cool-season flowers and prepare beds for annuals after frost danger passes.","Divide suitable established perennials before hot weather."]},
  summer:{title:"Keep the color coming",tasks:["Deadhead zinnias, cosmos, dianthus, and marigolds for more blooms.","Water deeply in the morning and keep leaves dry where possible.","Leave some flowers for bees and butterflies; avoid spraying open blooms."]},
  fall:{title:"Prepare for next spring",tasks:["Plant tulip and ornamental allium bulbs after soil cools.","Collect dry zinnia and cosmos seeds and label them.","Leave some sturdy stems and seedheads for winter habitat; mulch tender plants after soil cools."]},
  winter:{title:"Let the garden rest",tasks:["Avoid cutting back all perennial stems; some shelter overwintering insects.","Check stored bulbs and corms for rot or drying.","Plan spring color, order seeds, and protect pots from freeze–thaw damage."]},
};
export const cornerPlanting = [
  {season:"Spring",title:"Cool-season color",flowers:"Pansies, violas, calendula, snapdragons, sweet alyssum",timing:"Plant hardy transplants in early spring when soil is workable. Start warm-season annuals indoors according to seed packet timing; wait until frost risk passes before planting them outside."},
  {season:"Summer",title:"Heat-loving blooms",flowers:"Zinnias, cosmos, marigolds, sunflowers",timing:"Sow or transplant after the last spring frost when soil is warm. Succession-sow fast-growing annuals through early summer for continued flowers."},
  {season:"Fall",title:"Plant next spring's bulbs",flowers:"Tulips, ornamental alliums, daffodils; cool-weather pansies",timing:"Plant spring-flowering bulbs once soil cools, before it freezes. In cold climates, fall-planted annuals may not overwinter."},
  {season:"Winter",title:"Plan and start indoors",flowers:"Lisianthus and other long-season flowers; hardy annuals for later transplant",timing:"Order seeds, check germination requirements and start only varieties that need a long lead time. Most outdoor planting waits until spring."},
];
export const cornerSeedGuides = [
  {name:"Zinnia",when:"Late summer to fall, once flower heads are fully brown and dry",how:"Leave several blooms on the plant until dry. Break apart the seed head, separate mature seeds, and dry thoroughly before storing."},
  {name:"Cosmos",when:"Summer to fall, when the narrow seeds turn brown or black",how:"Collect dry, elongated seeds from spent flower heads before they scatter. Dry and label by variety."},
  {name:"Marigold",when:"Late summer to fall, when flower heads are papery and dry",how:"Pull apart the dry head to find slender, dark-and-pale seeds. Air-dry before storing."},
  {name:"Calendula",when:"Late spring through fall, when curved seeds turn tan or brown",how:"Pick mature, dry seed heads and separate the curved seeds. Save in a labeled paper envelope."},
  {name:"Nasturtium",when:"Summer to fall, when fallen seeds have matured and dried",how:"Collect the large, wrinkled seeds as they drop or loosen. Dry completely in a ventilated place before storing."},
  {name:"Dianthus",when:"After flowering, when seed capsules are dry and opening",how:"Shake ripe capsules into a paper bag. Named hybrids may not grow true to type from seed."},
];
export const cornerCutFlowers = [
  {name:"Dahlias",when:"Midsummer to frost",tip:"Cut fully open blooms; lift and store tubers where winter freezing would damage them."},
  {name:"Lisianthus",when:"Summer",tip:"Start early or use plugs. Harvest when the first blooms open."},
  {name:"Statice",when:"Summer",tip:"Papery clusters for fresh and dried arrangements."},
  {name:"Sweet Alyssum",when:"Spring and fall",tip:"Low, fragrant filler; use small flowering sprigs."},
  {name:"Strawflower",when:"Summer to frost",tip:"Harvest as outer bracts begin to open; excellent dried."},
  {name:"Snapdragons",when:"Late spring to fall",tip:"Cut when lower florets open; tall varieties give structure."},
  {name:"Calendula",when:"Spring and fall",tip:"Harvest newly opened flowers during cooler weather."},
  {name:"Cosmos",when:"Summer to frost",tip:"Cut buds just opening for airy movement."},
  {name:"Rudbeckia",when:"Summer to fall",tip:"Harvest firm blooms for long-lasting golden accents."},
  {name:"Gomphrena",when:"Summer to frost",tip:"Harvest fully colored globe flowers, fresh or dried."},
  {name:"Celosia",when:"Summer to frost",tip:"Cut developed plumes or crests; dries well."},
  {name:"Amaranth",when:"Summer to fall",tip:"Dramatic upright or trailing tassels."},
  {name:"Nigella",when:"Late spring to summer",tip:"Use flowers and decorative seed pods."},
  {name:"Yarrow",when:"Summer",tip:"Cut when most small flowers are open."},
  {name:"Scabiosa",when:"Summer to frost",tip:"Pincushion flowers in soft pinks and purples; cut often."},
  {name:"Ammi Majus",when:"Early to midsummer",tip:"White lace-like umbels make airy bouquet filler."},
  {name:"Chantilly Snapdragons",when:"Late spring to fall",tip:"Elegant open-faced snapdragon spikes; support tall stems."},
  {name:"Bupleurum",when:"Late spring to summer",tip:"Chartreuse greenery for light, natural arrangements."},
  {name:"Astrantia",when:"Late spring to summer",tip:"Starry blooms; prefers moisture and afternoon shade."},
  {name:"Asters",when:"Late summer to fall",tip:"Colorful late-season daisy-like cut flowers."},
  {name:"Feverfew",when:"Early summer",tip:"Clusters of small white flowers add soft texture."},
  {name:"Larkspur",when:"Late spring to early summer",tip:"Cool-season blue, pink and lavender spires; all parts toxic."},
  {name:"Orlaya",when:"Late spring to summer",tip:"Elegant white lace flowers for romantic bouquets."},
  {name:"Bachelor's Buttons",when:"Late spring to summer",tip:"Bright blue blooms; cut before centers show pollen."},
  {name:"Bells of Ireland",when:"Summer",tip:"Tall green bells for bouquet structure."},
  {name:"Sweet Peas",when:"Late spring to early summer",tip:"Fragrant flowers for cool weather; provide a trellis."},
  {name:"Rudbeckia Sahara",when:"Summer to fall",tip:"Warm copper, rose and terracotta blooms; colors vary."},
  {name:"Hydrangeas",when:"Summer to fall",tip:"Harvest mature blooms appropriate to the hydrangea type and hydrate promptly."},
  {name:"Ranunculus",when:"Spring",tip:"Cut soft, colored buds; protect corms from hard freezes."},
  {name:"Zinnias",when:"Summer to frost",tip:"Harvest when stems are firm enough to support the bloom (the wiggle test)."},
] as const;



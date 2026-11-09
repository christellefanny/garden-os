/** Editorial crop guidance, never a measurement or suitability verdict for a user's soil. */
export type VegetableSoilProfile = {
  id: string;
  name: string;
  aliases: string[];
  bed: string;
  container: string;
  moisture: string;
  ph: { min: number; max: number; note: string } | null;
  notes: string[];
  sources: { title: string; url: string }[];
  reviewed: string;
};

export type SoilGrowingContext = "bed" | "container" | "hydroponic" | "unknown";

export const vegetableSoilProfiles: VegetableSoilProfile[] = [
  {
    "id": "tomato",
    "name": "Tomato",
    "aliases": [
      "tomatoes",
      "Slicing tomato"
    ],
    "bed": "Choose deep, crumbly soil that holds some moisture but lets excess water escape. Compost can improve the bed. Avoid a spot that stays soggy, and mulch the surface to help keep moisture steady around the roots.",
    "container": "Use a generous container with drainage holes and a light potting mix that retains moisture. Match the pot and support to the variety: dwarf and determinate tomatoes are usually easier to manage than vigorous vining types.",
    "moisture": "Keep moisture consistent, especially as fruit develops. Water the root zone thoroughly rather than giving frequent shallow splashes. Check containers often in hot or windy weather; repeated drying and rewetting can contribute to cracking and blossom-end rot.",
    "ph": {
      "min": 6.0,
      "max": 6.8,
      "note": "A preferred garden-soil range, not an automatic reason to change your soil. Check a soil test before adjusting pH."
    },
    "notes": [
      "There is no single pot size suitable for every tomato variety."
    ],
    "sources": [
      {
        "title": "Iowa State University Extension: Growing Tomatoes in the Home Garden",
        "url": "https://yardandgarden.extension.iastate.edu/how-to/growing-tomatoes-home-garden"
      },
      {
        "title": "Iowa State University Extension: Growing Tomatoes in Containers",
        "url": "https://yardandgarden.extension.iastate.edu/how-to/growing-tomatoes-containers"
      }
    ],
    "reviewed": "2026-11-08"
  },
  {
    "id": "bell-pepper",
    "name": "Bell Pepper",
    "aliases": [
      "bell peppers",
      "Sweet bell pepper"
    ],
    "bed": "Give bell peppers warm, well-drained soil with organic matter worked through the rooting area. Keep the bed moist without leaving it soggy. A raised bed can help where the planting area regularly holds excess water.",
    "container": "Use a roomy container with drainage holes and a light, moisture-retaining potting mix. Match its capacity to the mature plant rather than the seedling. Empty standing water from saucers, and do not add a gravel drainage layer.",
    "moisture": "Aim for steady moisture through flowering and fruit growth. Water at soil level and check pots regularly because they dry faster than beds. Mulch once the ground has warmed to reduce moisture swings, without keeping the roots waterlogged.",
    "ph": {
      "min": 6.0,
      "max": 6.8,
      "note": "A preferred garden-soil range, not an automatic reason to change your soil. Check a soil test before adjusting pH."
    },
    "notes": [
      "Uses general Capsicum pepper guidance; bell pepper is a Capsicum annuum type."
    ],
    "sources": [
      {
        "title": "UConn Extension: Peppers",
        "url": "https://homegarden.cahnr.uconn.edu/factsheets/peppers/"
      },
      {
        "title": "Michigan State University Extension: How to grow peppers",
        "url": "https://www.canr.msu.edu/uploads/files/peppers.pdf"
      },
      {
        "title": "University of Maryland Extension: Growing Vegetables in Containers and Salad Tables",
        "url": "https://www.extension.umd.edu/resource/growing-vegetables-containers-and-salad-tables"
      },
      {
        "title": "University of Maryland Extension: Types of Containers for Growing Vegetables",
        "url": "https://extension.umd.edu/resource/types-containers-growing-vegetables"
      },
      {
        "title": "University of Maryland Extension: Growing Media (Potting Soil) for Containers",
        "url": "https://extension.umd.edu/resource/growing-media-potting-soil-containers"
      }
    ],
    "reviewed": "2026-11-08"
  },
  {
    "id": "habanero-pepper",
    "name": "Habanero Pepper",
    "aliases": [
      "habanero",
      "habanero peppers",
      "habañero pepper"
    ],
    "bed": "Plant habaneros in fertile soil that drains freely. Compost can help the bed hold moisture while improving its structure. Where water collects, a well-prepared raised bed can reduce standing water around the roots and improve growing conditions.",
    "container": "Use a roomy container with drainage holes and a light, moisture-retaining potting mix. Match its capacity to the mature plant rather than the seedling. Empty standing water from saucers, and do not add a gravel drainage layer.",
    "moisture": "Keep the root zone consistently moist, allowing excess water to drain away. Check container plants frequently during hot weather. Use mulch to slow drying once the ground is warm; do not treat a love of heat as a need for drought.",
    "ph": {
      "min": 6.0,
      "max": 7.0,
      "note": "Rutgers gives this preferred range specifically for habanero. Test before making pH changes; a tolerance range is not a target."
    },
    "notes": [
      "Habanero is Capsicum chinense. Moisture and container advice here is shared pepper guidance, not a cultivar-specific prescription."
    ],
    "sources": [
      {
        "title": "Rutgers Cooperative Extension: Production and Marketing of Habañero Peppers in New Jersey",
        "url": "https://extension.rutgers.edu/fs1273"
      },
      {
        "title": "UConn Extension: Peppers",
        "url": "https://homegarden.cahnr.uconn.edu/factsheets/peppers/"
      },
      {
        "title": "University of Maryland Extension: Growing Vegetables in Containers and Salad Tables",
        "url": "https://www.extension.umd.edu/resource/growing-vegetables-containers-and-salad-tables"
      },
      {
        "title": "University of Maryland Extension: Types of Containers for Growing Vegetables",
        "url": "https://extension.umd.edu/resource/types-containers-growing-vegetables"
      },
      {
        "title": "University of Maryland Extension: Growing Media (Potting Soil) for Containers",
        "url": "https://extension.umd.edu/resource/growing-media-potting-soil-containers"
      },
      {
        "title": "University of Minnesota Extension: Fertilizing and watering container plants",
        "url": "https://extension.umn.edu/garden-and-home/yard-and-garden/gardening-in-minnesota/fertilizing-and-watering-container-plants"
      }
    ],
    "reviewed": "2026-11-08"
  },
  {
    "id": "scotch-bonnet-pepper",
    "name": "Scotch Bonnet Pepper",
    "aliases": [
      "scotch bonnet",
      "scotch bonnet peppers"
    ],
    "bed": "Use the general pepper approach: warm, well-drained soil with organic matter, keeping the rooting area open rather than compacted and soggy. If the site stays wet, improve drainage or choose a raised bed before planting.",
    "container": "Use a roomy container with drainage holes and a light, moisture-retaining potting mix. Match its capacity to the mature plant rather than the seedling. Empty standing water from saucers, and do not add a gravel drainage layer.",
    "moisture": "Maintain fairly even moisture through the growing season and water thoroughly when the root zone begins to dry. Mulch helps slow evaporation. Pots need closer checks than beds, especially in heat or wind; avoid leaving them standing in water.",
    "ph": {
      "min": 6.0,
      "max": 6.8,
      "note": "This is UConn’s general pepper range, not a Scotch Bonnet cultivar trial result. Test before adjusting garden soil."
    },
    "notes": [
      "Scotch Bonnet is Capsicum chinense. This entry deliberately shares the general pepper soil and drainage profile."
    ],
    "sources": [
      {
        "title": "UConn Extension: Peppers",
        "url": "https://homegarden.cahnr.uconn.edu/factsheets/peppers/"
      },
      {
        "title": "Iowa State University Extension: Growing Peppers in the Home Garden",
        "url": "https://yardandgarden.extension.iastate.edu/how-to/growing-peppers-home-garden"
      },
      {
        "title": "University of Maryland Extension: Growing Vegetables in Containers and Salad Tables",
        "url": "https://www.extension.umd.edu/resource/growing-vegetables-containers-and-salad-tables"
      },
      {
        "title": "University of Maryland Extension: Types of Containers for Growing Vegetables",
        "url": "https://extension.umd.edu/resource/types-containers-growing-vegetables"
      },
      {
        "title": "University of Maryland Extension: Growing Media (Potting Soil) for Containers",
        "url": "https://extension.umd.edu/resource/growing-media-potting-soil-containers"
      },
      {
        "title": "University of Minnesota Extension: Fertilizing and watering container plants",
        "url": "https://extension.umn.edu/garden-and-home/yard-and-garden/gardening-in-minnesota/fertilizing-and-watering-container-plants"
      }
    ],
    "reviewed": "2026-11-08"
  },
  {
    "id": "serrano-pepper",
    "name": "Serrano Pepper",
    "aliases": [
      "serrano",
      "serrano peppers"
    ],
    "bed": "Choose warm soil that drains well and has moderate fertility. Compost can improve the rooting area and moisture retention. Keep the ground free of persistent standing water; serranos use the same basic soil approach as other garden peppers.",
    "container": "Use a roomy container with drainage holes and a light, moisture-retaining potting mix. Match its capacity to the mature plant rather than the seedling. Empty standing water from saucers, and do not add a gravel drainage layer.",
    "moisture": "Water regularly enough to prevent drought stress, particularly during flowering, when a shortage can reduce fruit set. Soak the soil rather than the leaves. Mulch established plants to slow drying, and check container moisture more often during warm, windy weather.",
    "ph": {
      "min": 6.0,
      "max": 6.8,
      "note": "This is a general garden-pepper range from Michigan State, not a special requirement established for every serrano cultivar."
    },
    "notes": [
      "Serrano is a Capsicum annuum pepper. Variety size still matters when choosing a container."
    ],
    "sources": [
      {
        "title": "Michigan State University Extension: How to grow peppers",
        "url": "https://www.canr.msu.edu/uploads/files/peppers.pdf"
      },
      {
        "title": "Iowa State University Extension: Growing Peppers in the Home Garden",
        "url": "https://yardandgarden.extension.iastate.edu/how-to/growing-peppers-home-garden"
      },
      {
        "title": "University of Maryland Extension: Growing Vegetables in Containers and Salad Tables",
        "url": "https://www.extension.umd.edu/resource/growing-vegetables-containers-and-salad-tables"
      },
      {
        "title": "University of Maryland Extension: Types of Containers for Growing Vegetables",
        "url": "https://extension.umd.edu/resource/types-containers-growing-vegetables"
      },
      {
        "title": "University of Maryland Extension: Growing Media (Potting Soil) for Containers",
        "url": "https://extension.umd.edu/resource/growing-media-potting-soil-containers"
      },
      {
        "title": "University of Minnesota Extension: Fertilizing and watering container plants",
        "url": "https://extension.umn.edu/garden-and-home/yard-and-garden/gardening-in-minnesota/fertilizing-and-watering-container-plants"
      }
    ],
    "reviewed": "2026-11-08"
  },
  {
    "id": "lettuce",
    "name": "Lettuce",
    "aliases": [
      "lettuces",
      "leaf lettuce",
      "loose-leaf lettuce",
      "romaine lettuce",
      "cos lettuce",
      "butterhead lettuce",
      "bibb lettuce",
      "iceberg lettuce",
      "crisphead lettuce"
    ],
    "bed": "Choose fertile soil that drains well but holds moisture. Mix in finished compost where needed and rake the surface fine for the tiny seeds. Lettuce's shallow feeding roots struggle when the upper soil becomes dry or low in nutrients.",
    "container": "Use a moisture-retentive, airy potting mix in a container with open drainage holes. Leave room for the mature lettuce type rather than crowding seedlings. Keep the mix moist, and let surplus water escape instead of collecting around the roots.",
    "moisture": "Keep the root zone evenly moist while leaves develop. Check sandy soil more often, and water thoroughly when needed rather than waiting for wilting. A dry spell followed by rapid growth can contribute to leaf tipburn and poorer quality.",
    "ph": {
      "min": 6,
      "max": 6.8,
      "note": "A garden-soil guideline, not a reading of your soil. Use a soil test before adding lime or sulfur."
    },
    "notes": [
      "Heading and loose-leaf lettuces need different final spacing; follow the variety's instructions.",
      "This profile is for lettuce, not endive, radicchio or other salad greens."
    ],
    "sources": [
      {
        "title": "University of Minnesota Extension: Growing lettuce, endive and radicchio in home gardens",
        "url": "https://extension.umn.edu/garden-and-home/yard-and-garden/gardening-in-minnesota/growing-lettuce-endive-and-radicchio"
      },
      {
        "title": "NC State Extension: Plants Grown in Containers",
        "url": "https://content.ces.ncsu.edu/extension-gardener-handbook/18-plants-grown-in-containers"
      }
    ],
    "reviewed": "2026-11-08"
  },
  {
    "id": "garlic",
    "name": "Garlic",
    "aliases": [
      "hardneck garlic",
      "softneck garlic"
    ],
    "bed": "Prepare a loose bed so bulbs can expand, with soil that drains well while retaining useful moisture. Finished compost can improve organic matter. Avoid fresh manure, and use a soil test to guide feeding rather than repeatedly adding rich amendments.",
    "container": "Fill a well-drained pot with a quality potting mix that holds some moisture without becoming compacted. Allow room for mature bulbs using your variety's spacing guidance. Keep drainage holes clear; a gravel layer below the mix does not improve drainage.",
    "moisture": "Water thoroughly during active growth and check sandy soil more frequently. Keep moisture steady rather than leaving the bed saturated. Stop watering about two weeks before the expected harvest to help protect bulb wrappers and reduce disease problems during drying.",
    "ph": {
      "min": 6,
      "max": 7,
      "note": "A garden-soil guideline, not a reading of your soil. Use a soil test before adding lime or sulfur."
    },
    "notes": [
      "Hardneck and softneck garlic share these soil basics, but choose a variety suited to your climate.",
      "Elephant garlic is a leek relative and is not included in these aliases."
    ],
    "sources": [
      {
        "title": "University of Minnesota Extension: Growing garlic in home gardens",
        "url": "https://extension.umn.edu/garden-and-home/yard-and-garden/gardening-in-minnesota/growing-garlic"
      },
      {
        "title": "NC State Extension: Plants Grown in Containers",
        "url": "https://content.ces.ncsu.edu/extension-gardener-handbook/18-plants-grown-in-containers"
      }
    ],
    "reviewed": "2026-11-08"
  },
  {
    "id": "onion",
    "name": "Onion",
    "aliases": [
      "onions",
      "bulb onion",
      "bulb onions",
      "storage onion",
      "storage onions",
      "red onion",
      "yellow onion",
      "white onion"
    ],
    "bed": "Grow bulb onions in well-drained soil with good organic matter. Work in finished compost if needed, and keep the surface loose without damaging the shallow roots or bulbs. Avoid excessive nitrogen, which can delay maturity and reduce storage quality.",
    "container": "Use a potting mix that balances moisture retention with air space, and a container that drains freely. Give each plant enough room to form its intended bulb. Do not crowd bulb onions as tightly as onions harvested young for greens.",
    "moisture": "Keep moisture consistent while the onions are actively growing. Their shallow roots cannot draw readily from deeper reserves, so check the upper root zone frequently, especially in sandy soil. Water thoroughly when needed without leaving roots in waterlogged conditions.",
    "ph": {
      "min": 6,
      "max": 7,
      "note": "A garden-soil guideline, not a reading of your soil. Use a soil test before adding lime or sulfur."
    },
    "notes": [
      "This is a bulb-onion profile. Green onions, scallions and bunching onions are not automatic aliases.",
      "Choose an onion variety with a day-length requirement suited to your region; good soil alone will not ensure bulb formation."
    ],
    "sources": [
      {
        "title": "University of Minnesota Extension: Growing onions in home gardens",
        "url": "https://extension.umn.edu/garden-and-home/yard-and-garden/gardening-in-minnesota/growing-onions"
      },
      {
        "title": "NC State Extension: Plants Grown in Containers",
        "url": "https://content.ces.ncsu.edu/extension-gardener-handbook/18-plants-grown-in-containers"
      }
    ],
    "reviewed": "2026-11-08"
  },
  {
    "id": "okra",
    "name": "Okra",
    "aliases": [
      "okra plants"
    ],
    "bed": "Okra prefers fertile, well-drained soil; sandy loam is a good fit, but other soils can work if drainage is sound. Avoid a persistently wet bed. Base any soil amendments on what the bed actually needs.",
    "container": "Choose a stable, roomy container with drainage holes and an airy potting mix. Okra varieties differ greatly in height, so check the mature size before choosing a pot. Support tall plants rather than crowding them into a small container.",
    "moisture": "Established okra tolerates some dry conditions, but dependable moisture improves growth and pod production. Water the root zone when needed and let excess water drain. Check container plants more often; okra does not tolerate continuously wet soil.",
    "ph": {
      "min": 6.0,
      "max": 7.0,
      "note": "A preferred garden-soil range, not an automatic reason to change your soil. Check a soil test before adjusting pH."
    },
    "notes": [
      "Compact and tall okra varieties need different amounts of space and support."
    ],
    "sources": [
      {
        "title": "Utah State University Extension: Okra in the Garden",
        "url": "https://extension.usu.edu/yardandgarden/research/okra-in-the-garden"
      },
      {
        "title": "University of Maryland Extension: Growing Vegetables in Containers and Salad Tables",
        "url": "https://www.extension.umd.edu/resource/growing-vegetables-containers-and-salad-tables"
      },
      {
        "title": "University of Maryland Extension: Types of Containers for Growing Vegetables",
        "url": "https://extension.umd.edu/resource/types-containers-growing-vegetables"
      },
      {
        "title": "University of Maryland Extension: Growing Media (Potting Soil) for Containers",
        "url": "https://extension.umd.edu/resource/growing-media-potting-soil-containers"
      }
    ],
    "reviewed": "2026-11-08"
  },
  {
    "id": "sweet-potato",
    "name": "Sweet Potato",
    "aliases": [
      "sweet potatoes",
      "sweetpotato",
      "sweetpotatoes"
    ],
    "bed": "Use loose, well-drained soil with room for the storage roots to expand. Light sandy soil suits sweet potatoes well; heavier soil can benefit from organic matter. Ridges or raised beds improve drainage and make harvesting easier.",
    "container": "Container growing is possible but more demanding than many vegetables. Use a large, well-drained pot or grow bag with light potting mix and space for expanding storage roots. Allow for trailing vines; compact varieties are easier to accommodate.",
    "moisture": "Keep newly planted slips well supplied with moisture while they establish. Established plants tolerate drier periods, but perform best with reliable watering. Avoid saturation and excessive watering as harvest approaches, since too much water can encourage rot and split roots.",
    "ph": null,
    "notes": [
      "Sweet potato forms storage roots and needs different guidance from potato.",
      "True yams are different plants; check the identity of plants sold as “yam”."
    ],
    "sources": [
      {
        "title": "University of Maryland Extension: Growing Sweet Potatoes in a Home Garden",
        "url": "https://extension.umd.edu/resource/growing-sweet-potatoes-home-garden"
      },
      {
        "title": "Utah State University Extension: How to Grow Sweet Potatoes in Your Garden",
        "url": "https://extension.usu.edu/yardandgarden/research/sweet-potatoes-in-the-garden"
      },
      {
        "title": "University of Maryland Extension: Growing Vegetables in Containers and Salad Tables",
        "url": "https://www.extension.umd.edu/resource/growing-vegetables-containers-and-salad-tables"
      },
      {
        "title": "University of Maryland Extension: Types of Containers for Growing Vegetables",
        "url": "https://extension.umd.edu/resource/types-containers-growing-vegetables"
      },
      {
        "title": "University of Maryland Extension: Growing Media (Potting Soil) for Containers",
        "url": "https://extension.umd.edu/resource/growing-media-potting-soil-containers"
      }
    ],
    "reviewed": "2026-11-08"
  },
  {
    "id": "broccoli",
    "name": "Broccoli",
    "aliases": [
      "calabrese broccoli"
    ],
    "bed": "Provide fertile soil that drains freely yet retains moisture between waterings. Add finished compost if organic matter is low, and base extra nutrients on a soil test. Broccoli needs an uninterrupted supply of water and nutrients as the plant and head develop.",
    "container": "Use an airy, moisture-holding potting mix and unobstructed drainage holes. Match the container to the mature plant rather than its small transplant size. Leave enough root space to support steady growth, and avoid compressing the mix or adding a gravel layer.",
    "moisture": "Keep the root zone consistently moist from establishment through head formation. Water thoroughly when needed and check sandy soil more often. Drought stress can produce small heads and poorer flavor, so do not let the plant repeatedly dry out between waterings.",
    "ph": {
      "min": 6,
      "max": 7,
      "note": "A garden-soil guideline, not a reading of your soil. Use a soil test before adding lime or sulfur."
    },
    "notes": [
      "This profile covers conventional heading broccoli. Broccoli rabe, rapini and Chinese broccoli need their own crop identification.",
      "Rotate away from related cabbage-family crops where practical."
    ],
    "sources": [
      {
        "title": "University of Minnesota Extension: Growing broccoli in home gardens",
        "url": "https://extension.umn.edu/garden-and-home/yard-and-garden/gardening-in-minnesota/growing-broccoli"
      },
      {
        "title": "NC State Extension: Plants Grown in Containers",
        "url": "https://content.ces.ncsu.edu/extension-gardener-handbook/18-plants-grown-in-containers"
      },
      {
        "title": "University of Maryland Extension: Growing Vegetables in Containers and Salad Tables",
        "url": "https://extension.umd.edu/resource/growing-vegetables-containers-and-salad-tables"
      }
    ],
    "reviewed": "2026-11-08"
  },
  {
    "id": "carrot",
    "name": "Carrot",
    "aliases": [
      "carrots"
    ],
    "bed": "Loosen soil through the expected root depth and remove stones and hard clods. Light sandy loam is ideal, but heavier soil can work if it drains well and is not compacted. Sow directly where the carrots will grow to avoid disturbing young taproots.",
    "container": "Sow directly into the final container, using loose potting mix and drainage holes. Choose a depth that accommodates your variety's mature root length; shorter-rooted carrots suit more limited space. Thin seedlings so roots can expand without competing closely with their neighbors.",
    "moisture": "Keep the seedbed moist during germination, using a gentle spray if a surface crust forms. Once growing, water deeply enough to moisten the root zone. Drought can leave carrots tough, small or misshapen, so avoid repeated drying during root development.",
    "ph": {
      "min": 6,
      "max": 7,
      "note": "A garden-soil guideline, not a reading of your soil. Use a soil test before adding lime or sulfur."
    },
    "notes": [
      "Long-rooted and short-rooted varieties have different depth needs; there is no single pot depth for every carrot.",
      "Excess nitrogen can favor leafy growth instead of roots."
    ],
    "sources": [
      {
        "title": "University of Minnesota Extension: Growing carrots and parsnips in home gardens",
        "url": "https://extension.umn.edu/garden-and-home/yard-and-garden/gardening-in-minnesota/growing-carrots-and-parsnips"
      },
      {
        "title": "Illinois Extension: Growing Vegetables in Containers",
        "url": "https://extension.illinois.edu/container-gardens/growing-vegetables-containers"
      },
      {
        "title": "Illinois Extension: Vegetable Containers",
        "url": "https://extension.illinois.edu/container-gardens/vegetable-containers"
      }
    ],
    "reviewed": "2026-11-08"
  },
  {
    "id": "beet",
    "name": "Beet",
    "aliases": [
      "beets",
      "beetroot",
      "beetroots",
      "garden beet",
      "garden beets"
    ],
    "bed": "Choose deep, fertile soil with good drainage so roots can enlarge without restriction. Improve heavy soil with finished compost as needed, using a soil test to guide additions. Keep the seedbed surface fine and moist, and thin crowded seedlings for better root development.",
    "container": "Use loose potting mix in a container with drainage holes and space for the mature roots. Sow at the variety's recommended depth, then thin seedlings rather than keeping a dense clump. Leave enough room for root growth, not just leafy tops.",
    "moisture": "Water regularly to maintain even moisture as roots enlarge. Large swings between dry and wet conditions can crack roots and slow growth. Mulch can help conserve water; adjust watering to the soil rather than following a fixed schedule regardless of conditions.",
    "ph": null,
    "notes": [
      "For garden beets harvested for their roots. Sugar beet, fodder beet and Swiss chard need their own growing guidance."
    ],
    "sources": [
      {
        "title": "Utah State University Extension: How to Grow Beets in Your Garden",
        "url": "https://extension.usu.edu/yardandgarden/research/beets-in-the-garden"
      },
      {
        "title": "Illinois Extension: Growing Vegetables in Containers",
        "url": "https://extension.illinois.edu/container-gardens/growing-vegetables-containers"
      },
      {
        "title": "Illinois Extension: Soil for Container Gardens",
        "url": "https://extension.illinois.edu/container-gardens/soil"
      },
      {
        "title": "University of Minnesota Extension: Growing spinach and Swiss chard in home gardens",
        "url": "https://extension.umn.edu/garden-and-home/yard-and-garden/gardening-in-minnesota/growing-spinach-and-swiss-chard"
      }
    ],
    "reviewed": "2026-11-08"
  },
  {
    "id": "radish",
    "name": "Radish",
    "aliases": [
      "radishes",
      "garden radish",
      "garden radishes",
      "daikon",
      "daikon radish",
      "daikon radishes",
      "spring radish",
      "spring radishes"
    ],
    "bed": "Use well-drained, uncompacted soil and loosen it before sowing. Small salad radishes need less prepared depth than long daikon types. In very stony or heavy soil, choose shorter varieties and improve the bed with finished compost rather than fresh manure.",
    "container": "Use potting mix with unobstructed drainage and match the container depth to the mature root. Short salad radishes fit smaller spaces; long daikon needs considerably more depth. Direct sow and thin seedlings to the variety's spacing so the roots can swell.",
    "moisture": "Keep moisture consistent through the short growing period, with thorough watering when needed. Drought can make radishes tough and sharply flavored, while uneven moisture can split the roots. Check sandy soil frequently and avoid letting seedlings struggle under a hard surface crust.",
    "ph": {
      "min": 6,
      "max": 7,
      "note": "A garden-soil guideline, not a reading of your soil. Use a soil test before adding lime or sulfur."
    },
    "notes": [
      "Daikon is included only because this profile explicitly distinguishes its greater depth and spacing needs.",
      "Follow the variety's planting-season guidance; hot weather can reduce root quality."
    ],
    "sources": [
      {
        "title": "University of Minnesota Extension: Growing radishes in home gardens",
        "url": "https://extension.umn.edu/garden-and-home/yard-and-garden/gardening-in-minnesota/growing-radishes"
      },
      {
        "title": "Illinois Extension: Growing Vegetables in Containers",
        "url": "https://extension.illinois.edu/container-gardens/growing-vegetables-containers"
      },
      {
        "title": "Illinois Extension: Vegetable Containers",
        "url": "https://extension.illinois.edu/container-gardens/vegetable-containers"
      }
    ],
    "reviewed": "2026-11-08"
  },
  {
    "id": "spinach",
    "name": "Spinach",
    "aliases": [
      "garden spinach",
      "true spinach"
    ],
    "bed": "Prepare a fertile bed with finished compost where needed, and use a soil test before adjusting pH or nutrients. Keep the soil evenly moist while plants establish. Spinach responds poorly when dry conditions interrupt leaf growth and encourage early flowering.",
    "container": "Use a container with drainage holes and an airy potting mix rather than garden soil alone. Direct sow, then thin to the variety's recommended spacing. Water the whole mix thoroughly when needed and allow the excess to drain from the pot.",
    "moisture": "Keep moisture steady to support tender leaves and delay drought-related bolting. Check more often in sandy soil or drying weather, and moisten the root zone thoroughly. Water cannot fully prevent flowering triggered by increasing day length and heat, so also choose the right growing season.",
    "ph": {
      "min": 6.5,
      "max": 8,
      "note": "The cited Extension guide gives this garden-soil range. Do not raise soil to the upper limit automatically; use a soil test and local advice."
    },
    "notes": [
      "This profile is for true spinach, Spinacia oleracea. Malabar spinach, New Zealand spinach and perpetual spinach are different crops.",
      "The pH range is general growing guidance, not a measured value for your garden."
    ],
    "sources": [
      {
        "title": "University of Minnesota Extension: Growing spinach and Swiss chard in home gardens",
        "url": "https://extension.umn.edu/garden-and-home/yard-and-garden/gardening-in-minnesota/growing-spinach-and-swiss-chard"
      },
      {
        "title": "Illinois Extension: Growing Vegetables in Containers",
        "url": "https://extension.illinois.edu/container-gardens/growing-vegetables-containers"
      },
      {
        "title": "Illinois Extension: Soil for Container Gardens",
        "url": "https://extension.illinois.edu/container-gardens/soil"
      }
    ],
    "reviewed": "2026-11-08"
  },
  {
    "id": "kale",
    "name": "Kale",
    "aliases": [
      "curly kale",
      "russian kale",
      "siberian kale"
    ],
    "bed": "Kale grows best in well-drained loam rich in organic matter. Heavier soil is usable if drainage is good; sandy soil needs closer attention to watering. Add finished compost where needed and use a soil test to decide whether extra nutrients are necessary.",
    "container": "Choose a pot large enough for the mature kale plant, with open drainage holes and a light potting mix that holds moisture. Fill loosely rather than packing the mix down. Give full-size plants more room than a crop harvested only as baby leaves.",
    "moisture": "Keep growth steady with enough water throughout leaf production. Heat and moisture stress can make kale tougher and more bitter. Check sandy soil more often, water the root zone thoroughly when needed, and use mulch to help limit drying between waterings.",
    "ph": {
      "min": 6,
      "max": 7.5,
      "note": "A garden-soil guideline, not a reading of your soil. Use a soil test before adding lime or sulfur."
    },
    "notes": [
      "Baby-leaf harvests and full-size kale plants need different spacing.",
      "Collards are related but are not included as a kale alias."
    ],
    "sources": [
      {
        "title": "University of Minnesota Extension: Growing collards and kale in home gardens",
        "url": "https://extension.umn.edu/garden-and-home/yard-and-garden/gardening-in-minnesota/growing-collards-and-kale"
      },
      {
        "title": "University of Maryland Extension: Growing Vegetables in Containers and Salad Tables",
        "url": "https://extension.umd.edu/resource/growing-vegetables-containers-and-salad-tables"
      }
    ],
    "reviewed": "2026-11-08"
  },
  {
    "id": "cucumber",
    "name": "Cucumber",
    "aliases": [
      "cucumbers"
    ],
    "bed": "Choose soil that retains moisture but drains freely. Work in mature compost to improve the bed rather than planting in a waterlogged spot. A raised bed can help where drainage is poor, while leaving room for roots and vines.",
    "container": "Fill a well-drained container with light potting mix, not dense garden soil. Bush varieties suit limited space more easily; vining types need a secure trellis. Match the container to the mature plant and keep its drainage holes clear.",
    "moisture": "Check moisture regularly because cucumbers use plenty of water while growing and fruiting. Soak the root zone when watering and keep the leaves dry where possible. Sandy soil, trellised plants, and containers can need more frequent attention.",
    "ph": {
      "min": 6.0,
      "max": 6.5,
      "note": "A preferred garden-soil range, not an automatic reason to change your soil. Check a soil test before adjusting pH."
    },
    "notes": [
      "Bush and vining cucumbers differ in space and support needs."
    ],
    "sources": [
      {
        "title": "University of Minnesota Extension: Growing cucumbers in home gardens",
        "url": "https://extension.umn.edu/garden-and-home/yard-and-garden/gardening-in-minnesota/growing-cucumbers"
      },
      {
        "title": "University of Maryland Extension: Growing Vegetables in Containers and Salad Tables",
        "url": "https://www.extension.umd.edu/resource/growing-vegetables-containers-and-salad-tables"
      },
      {
        "title": "University of Maryland Extension: Types of Containers for Growing Vegetables",
        "url": "https://extension.umd.edu/resource/types-containers-growing-vegetables"
      },
      {
        "title": "University of Maryland Extension: Growing Media (Potting Soil) for Containers",
        "url": "https://extension.umd.edu/resource/growing-media-potting-soil-containers"
      }
    ],
    "reviewed": "2026-11-08"
  },
  {
    "id": "zucchini",
    "name": "Zucchini",
    "aliases": [
      "courgette",
      "courgettes",
      "zucchinis"
    ],
    "bed": "Plant in rich, moisture-retaining soil that also drains well. Mature compost can improve soil structure. If the bed stays wet, improve drainage or use a raised bed; do not compensate for poor drainage by simply adding more water.",
    "container": "Use a large outdoor container with drainage holes and a light potting mix. A compact bush variety is easier to manage in limited space. Give the plant enough room to grow and mulch the surface to help steady moisture.",
    "moisture": "Zucchini needs a dependable supply of moisture for strong growth and fruiting. Water the soil thoroughly while keeping foliage dry where practical. Check sandy beds and containers more often, especially during warm weather, without leaving the rooting mix saturated.",
    "ph": {
      "min": 6.0,
      "max": 6.5,
      "note": "A preferred range from Minnesota Extension; the same guide notes squash can also grow successfully in neutral or slightly alkaline soil."
    },
    "notes": [
      "This profile is for zucchini/summer squash, not winter squash."
    ],
    "sources": [
      {
        "title": "University of Minnesota Extension: Growing summer squash and zucchini in home gardens",
        "url": "https://extension.umn.edu/garden-and-home/yard-and-garden/gardening-in-minnesota/growing-summer-squash-and-zucchini"
      },
      {
        "title": "University of Saskatchewan: Zucchini",
        "url": "https://gardening.usask.ca/gardening-advice/gardenline-nested-pages/food-plant-pages/vegetables/zucchini.php"
      },
      {
        "title": "University of Maryland Extension: Growing Media (Potting Soil) for Containers",
        "url": "https://extension.umd.edu/resource/growing-media-potting-soil-containers"
      }
    ],
    "reviewed": "2026-11-08"
  },
  {
    "id": "bean",
    "name": "Bean",
    "aliases": [
      "beans",
      "garden bean",
      "green bean",
      "snap bean",
      "bush bean",
      "pole bean",
      "Bush snap bean"
    ],
    "bed": "Garden beans need soil that holds moisture yet drains well. A crumbly surface helps seedlings emerge, and mature compost can improve structure. Avoid compacted or persistently wet ground; good drainage matters even in soils that naturally retain water.",
    "container": "Use a container with drainage holes and a light potting mix. Bush beans stay relatively compact, while pole beans need a sturdy climbing support. Choose the container and spacing for the bean type rather than assuming all beans grow alike.",
    "moisture": "Maintain reasonably consistent moisture as plants grow and pods develop. Check below the surface before watering; sandy soil and containers dry faster than moisture-retentive beds. Avoid large swings between drought and saturation, which can impair pod development.",
    "ph": {
      "min": 6.0,
      "max": 7.0,
      "note": "A preferred garden-soil range, not an automatic reason to change your soil. Check a soil test before adjusting pH."
    },
    "notes": [
      "Intended for common garden beans, especially snap/green beans. Bush and pole describe growth habits, not one universal bean species.",
      "Do not automatically apply this profile to fava beans, soybeans, or cowpeas."
    ],
    "sources": [
      {
        "title": "University of Minnesota Extension: Growing beans in home gardens",
        "url": "https://extension.umn.edu/garden-and-home/yard-and-garden/gardening-in-minnesota/growing-beans"
      },
      {
        "title": "Purdue Extension: Growing Beans in the Home Vegetable Garden",
        "url": "https://ag.purdue.edu/department/hla/extension/extension-publications-library/ext-pubs/ho-175-w.html"
      },
      {
        "title": "University of Maryland Extension: Growing Vegetables in Containers and Salad Tables",
        "url": "https://www.extension.umd.edu/resource/growing-vegetables-containers-and-salad-tables"
      },
      {
        "title": "University of Maryland Extension: Types of Containers for Growing Vegetables",
        "url": "https://extension.umd.edu/resource/types-containers-growing-vegetables"
      },
      {
        "title": "University of Maryland Extension: Growing Media (Potting Soil) for Containers",
        "url": "https://extension.umd.edu/resource/growing-media-potting-soil-containers"
      }
    ],
    "reviewed": "2026-11-08"
  },
  {
    "id": "pea",
    "name": "Pea",
    "aliases": [
      "peas",
      "garden pea",
      "green pea",
      "snap pea",
      "snow pea"
    ],
    "bed": "Peas grow in many soil types if excess water can drain away. Prepare a crumbly bed with mature compost and avoid soggy ground. They are cool-season plants, so good drainage is particularly useful when spring soil stays wet.",
    "container": "Choose a compact pea variety and a generous container filled with potting mix. Provide drainage holes and a trellis or other support suited to the variety. Keep the rooting mix evenly moist, with enough space for the plants to grow.",
    "moisture": "During cool, rainy weather, peas may need little extra watering. Check the soil instead of following a fixed schedule; water thoroughly during dry periods and aim at the soil rather than the vines. Mulch helps slow moisture loss.",
    "ph": {
      "min": 6.0,
      "max": 7.5,
      "note": "A preferred garden-soil range, not an automatic reason to change your soil. Check a soil test before adjusting pH."
    },
    "notes": [
      "Applies to garden, snap, and snow peas (Pisum sativum), not cowpeas or ornamental sweet peas."
    ],
    "sources": [
      {
        "title": "University of Minnesota Extension: Growing peas in home gardens",
        "url": "https://extension.umn.edu/garden-and-home/yard-and-garden/gardening-in-minnesota/growing-peas"
      },
      {
        "title": "Iowa State University Extension: Growing Peas in Iowa",
        "url": "https://yardandgarden.extension.iastate.edu/how-to/growing-peas-iowa"
      },
      {
        "title": "University of Maryland Extension: Types of Containers for Growing Vegetables",
        "url": "https://extension.umd.edu/resource/types-containers-growing-vegetables"
      }
    ],
    "reviewed": "2026-11-08"
  },
  {
    "id": "eggplant",
    "name": "Eggplant",
    "aliases": [
      "eggplants",
      "aubergine",
      "aubergines"
    ],
    "bed": "Choose fertile soil that drains freely and has warmed before planting. Mature compost can improve the bed’s structure. Eggplant grows poorly in cold conditions, and roots need both moisture and air rather than a continuously soggy planting area.",
    "container": "Use a roomy, stable container with drainage holes and an airy, moisture-retaining potting mix. Match the pot to the variety’s mature size and add support when planting if needed. Do not leave the container sitting in collected runoff.",
    "moisture": "Keep moisture fairly consistent as fruit develops. Water deeply at soil level, letting it soak in rather than run off. Avoid prolonged dryness and overwatering: irregular moisture can reduce fruit quality, while saturated soil increases the risk of root rot.",
    "ph": {
      "min": 5.5,
      "max": 7.5,
      "note": "Minnesota Extension gives this garden-soil range. Other regional guides use narrower preferred ranges, so use local soil-test advice before making adjustments."
    },
    "notes": [
      "Pot size and support depend on the eggplant variety; no universal container minimum is implied."
    ],
    "sources": [
      {
        "title": "University of Minnesota Extension: Growing eggplant in home gardens",
        "url": "https://extension.umn.edu/garden-and-home/yard-and-garden/gardening-in-minnesota/growing-eggplant"
      },
      {
        "title": "Utah State University Extension: How to Grow Eggplant in Your Garden",
        "url": "https://extension.usu.edu/yardandgarden/research/eggplant-in-the-garden/"
      },
      {
        "title": "University of Maryland Extension: Growing Vegetables in Containers and Salad Tables",
        "url": "https://www.extension.umd.edu/resource/growing-vegetables-containers-and-salad-tables"
      },
      {
        "title": "University of Maryland Extension: Types of Containers for Growing Vegetables",
        "url": "https://extension.umd.edu/resource/types-containers-growing-vegetables"
      },
      {
        "title": "University of Maryland Extension: Growing Media (Potting Soil) for Containers",
        "url": "https://extension.umd.edu/resource/growing-media-potting-soil-containers"
      }
    ],
    "reviewed": "2026-11-08"
  },
  {
    "id": "cabbage",
    "name": "Cabbage",
    "aliases": [
      "cabbages",
      "head cabbage",
      "heading cabbage",
      "red cabbage",
      "green cabbage",
      "savoy cabbage"
    ],
    "bed": "Choose fertile soil that holds moisture but drains well. Incorporate finished compost when needed, and use soil-test recommendations for additional nutrients. Cabbage needs steady growth to develop a good head, so avoid a compacted or persistently waterlogged planting site.",
    "container": "Use a stable container with enough space for the mature plant and a moisture-retentive, well-aerated potting mix. Keep drainage holes clear and follow the variety's spacing. Do not squeeze a full-size cabbage into a pot suited only to its young transplant.",
    "moisture": "Keep the root zone evenly moist while the head develops. Inconsistent rainfall or irrigation can leave cabbage bitter, poorly textured or unable to form a head. Check moisture below the surface and water thoroughly when needed, especially on sandy soils.",
    "ph": {
      "min": 6,
      "max": 7,
      "note": "A garden-soil guideline, not a reading of your soil. Use a soil test before adding lime or sulfur."
    },
    "notes": [
      "This profile covers heading cabbage, including red, green and savoy types.",
      "Napa cabbage, Chinese cabbage and bok choy are not automatic aliases."
    ],
    "sources": [
      {
        "title": "University of Minnesota Extension: Growing cabbage in home gardens",
        "url": "https://extension.umn.edu/garden-and-home/yard-and-garden/gardening-in-minnesota/growing-cabbage"
      },
      {
        "title": "University of Maryland Extension: Growing Vegetables in Containers and Salad Tables",
        "url": "https://extension.umd.edu/resource/growing-vegetables-containers-and-salad-tables"
      }
    ],
    "reviewed": "2026-11-08"
  },
  {
    "id": "cauliflower",
    "name": "Cauliflower",
    "aliases": [
      "cauliflowers",
      "romanesco cauliflower"
    ],
    "bed": "Provide rich, well-drained soil that retains moisture without becoming soggy. Finished compost can help improve the bed, but use a soil test to guide additional feeding. Cauliflower needs consistent access to water and nutrients from establishment through the development of its head.",
    "container": "Give the mature plant plenty of root space in a stable, freely draining container. Use an airy potting mix that retains moisture, fill it loosely, and keep drainage holes clear. Check the mix often because container roots have a limited water supply.",
    "moisture": "Avoid drought stress at every stage of growth, especially as the head develops. Water thoroughly when the root zone needs it, and check sandy soil more often. Uneven water supply can reduce head texture and flavor, so aim for consistently moist, well-drained conditions.",
    "ph": {
      "min": 6,
      "max": 7,
      "note": "A garden-soil guideline, not a reading of your soil. Use a soil test before adding lime or sulfur."
    },
    "notes": [
      "White, colored and Romanesco cauliflower share these soil basics, but head-shading requirements differ.",
      "Keep this profile separate from broccoli even when a cultivar name refers to a similar-looking head."
    ],
    "sources": [
      {
        "title": "University of Minnesota Extension: Growing cauliflower in home gardens",
        "url": "https://extension.umn.edu/garden-and-home/yard-and-garden/gardening-in-minnesota/growing-cauliflower"
      },
      {
        "title": "University of Maryland Extension: Growing Vegetables in Containers and Salad Tables",
        "url": "https://extension.umd.edu/resource/growing-vegetables-containers-and-salad-tables"
      }
    ],
    "reviewed": "2026-11-08"
  },
  {
    "id": "swiss-chard",
    "name": "Swiss Chard",
    "aliases": [
      "chard",
      "rainbow chard"
    ],
    "bed": "Choose fertile, well-drained soil with good organic matter. Add finished compost if the bed needs improvement, using soil-test guidance for other nutrients. Thin crowded plants and cultivate gently around them so damage to the roots does not interrupt steady leaf growth.",
    "container": "Use a potting mix that stays airy while holding moisture, in a container with free drainage. Allow space for the mature leaves and roots, rather than leaving seedlings crowded. Water the full root zone when needed and empty standing water from an ordinary pot's saucer.",
    "moisture": "Water regularly for continued production of tender leaves. Chard can survive dry spells, but new growth slows or stops and leaves may become tougher. Mulch helps conserve moisture; adjust watering for heat and soil type while keeping the root zone well drained.",
    "ph": null,
    "notes": [
      "Swiss chard is grown for leaves and stalks, rather than an enlarged beetroot."
    ],
    "sources": [
      {
        "title": "Utah State University Extension: How to Grow Swiss Chard in Your Garden",
        "url": "https://extension.usu.edu/yardandgarden/research/swiss-chard-in-the-garden"
      },
      {
        "title": "University of Minnesota Extension: Growing spinach and Swiss chard in home gardens",
        "url": "https://extension.umn.edu/garden-and-home/yard-and-garden/gardening-in-minnesota/growing-spinach-and-swiss-chard"
      },
      {
        "title": "University of Maryland Extension: Growing Vegetables in Containers and Salad Tables",
        "url": "https://extension.umd.edu/resource/growing-vegetables-containers-and-salad-tables"
      }
    ],
    "reviewed": "2026-11-08"
  },
  {
    "id": "corn",
    "name": "Sweet corn",
    "aliases": [
      "sweetcorn",
      "Corn"
    ],
    "bed": "For sweet corn, choose well-drained soil with organic matter and room for a group of plants. Arrange the crop in a block rather than a lone row to support pollination. Improve a bed that holds standing water before sowing.",
    "container": "Sweet corn is a challenging container crop because several plants must grow together for good pollination. A bed is usually more practical. If using containers, provide ample rooting space, drainage, and a grouped planting rather than a single isolated stalk.",
    "moisture": "Prevent drought stress during hot spells, especially around tasseling, silking, and ear development. Water the root zone thoroughly and check sandy soil more often. Containers need close attention because their limited supply of moisture can disappear quickly.",
    "ph": {
      "min": 5.8,
      "max": 7.0,
      "note": "This range applies to sweet corn grown in garden soil. Use local soil-test guidance before changing pH."
    },
    "notes": [
      "This guidance is for sweet corn. For popcorn, field corn or ornamental types, follow the variety’s growing guide."
    ],
    "sources": [
      {
        "title": "University of Minnesota Extension: Growing sweet corn in home gardens",
        "url": "https://extension.umn.edu/garden-and-home/yard-and-garden/gardening-in-minnesota/growing-sweet-corn"
      },
      {
        "title": "University of Maryland Extension: Growing Sweet Corn in a Home Garden",
        "url": "https://extension.umd.edu/resource/growing-sweet-corn-home-garden"
      },
      {
        "title": "University of Minnesota Extension: Irrigation strategies for vegetables",
        "url": "https://extension.umn.edu/agriculture/specialty-crops/vegetable-farming/irrigation-strategies-for-vegetables"
      },
      {
        "title": "University of Maryland Extension: Growing Vegetables in Containers and Salad Tables",
        "url": "https://www.extension.umd.edu/resource/growing-vegetables-containers-and-salad-tables"
      },
      {
        "title": "University of Maryland Extension: Types of Containers for Growing Vegetables",
        "url": "https://extension.umd.edu/resource/types-containers-growing-vegetables"
      },
      {
        "title": "University of Minnesota Extension: Fertilizing and watering container plants",
        "url": "https://extension.umn.edu/garden-and-home/yard-and-garden/gardening-in-minnesota/fertilizing-and-watering-container-plants"
      }
    ],
    "reviewed": "2026-11-08"
  },
  {
    "id": "potato",
    "name": "Potato",
    "aliases": [
      "potatoes",
      "irish potato",
      "white potato"
    ],
    "bed": "Choose loose, well-drained soil where developing tubers have room to expand. Keep tubers covered with soil as they grow to exclude light. Do not add lime or fresh manure automatically, particularly if potato scab has been a problem.",
    "container": "Use a roomy container or grow bag with drainage and a light potting mix. Allow space for developing tubers and keep them covered from light. Containers can work, but repeatedly building a tall potato tower does not reliably increase yield.",
    "moisture": "Keep moisture steady, especially while tubers are developing. Water the soil when rainfall is insufficient, without leaving the root zone saturated. Both excessive and inadequate water can cause tuber problems; check container plants more frequently during drying weather.",
    "ph": {
      "min": 6.0,
      "max": 6.5,
      "note": "A general garden target from Maryland Extension. Persistent scab may call for a more acidic approach; get local advice before changing pH, especially in a shared vegetable bed."
    },
    "notes": [
      "This guidance is for potato (Solanum tuberosum), not sweet potato.",
      "Scab management depends on disease history and the other crops sharing the bed. Get local advice before acidifying soil."
    ],
    "sources": [
      {
        "title": "University of Maryland Extension: Growing Potatoes in a Home Garden",
        "url": "https://extension.umd.edu/resource/growing-potatoes-home-garden"
      },
      {
        "title": "University of Wisconsin Extension: Potato Scab",
        "url": "https://hort.extension.wisc.edu/articles/potato-scab/"
      },
      {
        "title": "University of Maryland Extension: Growing Vegetables in Containers and Salad Tables",
        "url": "https://www.extension.umd.edu/resource/growing-vegetables-containers-and-salad-tables"
      },
      {
        "title": "University of Maryland Extension: Types of Containers for Growing Vegetables",
        "url": "https://extension.umd.edu/resource/types-containers-growing-vegetables"
      },
      {
        "title": "University of Maryland Extension: Growing Media (Potting Soil) for Containers",
        "url": "https://extension.umd.edu/resource/growing-media-potting-soil-containers"
      },
      {
        "title": "University of Minnesota Extension: Fertilizing and watering container plants",
        "url": "https://extension.umn.edu/garden-and-home/yard-and-garden/gardening-in-minnesota/fertilizing-and-watering-container-plants"
      }
    ],
    "reviewed": "2026-11-08"
  }
];

function normalize(value: string) {
  return value.normalize("NFKC").trim().toLowerCase().replace(/[‘’]/g, "'").replace(/\s+/g, " ");
}

const profilesByName = new Map<string, VegetableSoilProfile>();
for (const profile of vegetableSoilProfiles) {
  for (const name of [profile.name, ...profile.aliases]) {
    const key = normalize(name);
    const existing = profilesByName.get(key);
    if (existing && existing.id !== profile.id) throw new Error(`Ambiguous soil guidance alias: ${name}`);
    profilesByName.set(key, profile);
  }
}

/** Exact, reviewed names only. A cultivar name alone or a partial match is not plant identification. */
export function getVegetableSoilProfile(name: string, category?: string): VegetableSoilProfile | undefined {
  const declaredCategory = normalize(category || "");
  if (declaredCategory && declaredCategory !== "vegetable" && declaredCategory !== "other") return undefined;
  return profilesByName.get(normalize(name));
}

/** A container shape, location or soil-type note is not evidence of the growing method. */
export function soilGrowingContext(spaceType?: string, raisedBedBase?: unknown): SoilGrowingContext {
  switch (normalize(spaceType || "")) {
    case "raised bed":
      return raisedBedBase === "open-soil" ? "bed" : raisedBedBase === "closed-base" ? "container" : "unknown";
    case "in-ground bed":
      return "bed";
    case "container":
    case "grow bag":
    case "growing bag":
      return "container";
    case "hydroponic":
      return "hydroponic";
    default:
      return "unknown";
  }
}

export const seasons = ["spring", "summer", "fall", "winter"] as const;
export type Season = (typeof seasons)[number];
export type ThemeSelection = Season | "automatic";
export const THEME_STORAGE_KEY = "garden-os-season";

/** Northern Hemisphere meteorological seasons, in the viewer's local time. */
export function getSeason(date: Date): Season {
  const month = date.getMonth();
  if (month >= 2 && month <= 4) return "spring";
  if (month >= 5 && month <= 7) return "summer";
  if (month >= 8 && month <= 10) return "fall";
  return "winter";
}

export function parseThemeSelection(value: unknown): ThemeSelection {
  return value === "automatic" || seasons.includes(value as Season)
    ? (value as ThemeSelection)
    : "automatic";
}

type Shortcut = { label: string; icon: string; steps: string[] };
type SeasonContent = { name: string; icon: string; title: string; description: string; shortcuts: Shortcut[] };
export const seasonContent: Record<Season, SeasonContent> = {
  spring: {
    name: "Spring", icon: "🌷", title: "A fresh season starts here.",
    description: "Start seedlings, prepare your beds, and make room for new growth.",
    shortcuts: [
      { label: "Start Seeds", icon: "🌱", steps: ["Check seed packets for indoor sowing times.", "Label trays with variety and sowing date.", "Give seedlings bright light and consistent moisture."] },
      { label: "Frost Dates", icon: "❄️", steps: ["Check your location’s average last frost date.", "Watch the forecast before transplanting tender crops.", "Keep frost cloth ready for a late cold snap."] },
      { label: "Prepare Beds", icon: "🪴", steps: ["Wait until soil is workable rather than wet.", "Remove weeds and add finished compost.", "Plan spacing before planting."] },
      { label: "Plant", icon: "🌷", steps: ["Match each crop to its planting window.", "Harden off indoor seedlings before transplanting.", "Water new plantings gently and label them."] },
    ],
  },
  summer: {
    name: "Summer", icon: "🌻", title: "Your garden is in full swing.",
    description: "Keep up with watering, enjoy your harvests, and watch for visitors among the blooms.",
    shortcuts: [
      { label: "Watering", icon: "💧", steps: ["Check soil moisture before watering.", "Water at the roots early in the day.", "Check containers more often during hot weather."] },
      { label: "Harvest", icon: "🧺", steps: ["Check ripe crops regularly.", "Use clean tools and handle produce gently.", "Record what you picked and how much."] },
      { label: "Pests", icon: "🐛", steps: ["Inspect leaf undersides and new growth.", "Identify insects before treating; many are beneficial.", "Record damage and revisit affected plants."] },
      { label: "Garden Log", icon: "📸", steps: ["Photograph each growing space.", "Note watering, blooms, harvests, and problems.", "Record what worked for next season."] },
    ],
  },
  fall: {
    name: "Fall", icon: "🍂", title: "Gather the harvest. Grow what’s next.",
    description: "Harvest sweet potatoes before frost, save favorite seeds, and prepare your garlic bed.",
    shortcuts: [
      { label: "Harvest", icon: "🧺", steps: ["Watch the frost forecast for remaining tender crops.", "Lift sweet potatoes carefully before frost.", "Cure sweet potatoes in warm, humid conditions before storage."] },
      { label: "Save Seeds", icon: "🌾", steps: ["Choose healthy, mature, open-pollinated plants.", "Dry seeds thoroughly before packing.", "Label the crop, variety, and collection year."] },
      { label: "Plant Garlic", icon: "🧄", steps: ["Choose a sunny, well-drained bed.", "Plant individual cloves pointed end up in your local fall window.", "Mulch after planting and mark the bed."] },
      { label: "Cleanup", icon: "🍂", steps: ["Remove diseased plants from growing spaces.", "Leave healthy seed heads where they support wildlife.", "Clean tools and protect exposed soil with mulch."] },
    ],
  },
  winter: {
    name: "Winter", icon: "❄️", title: "Let the garden rest. Let ideas grow.",
    description: "Organize your seeds, sketch next season’s beds, and keep a little green growing indoors.",
    shortcuts: [
      { label: "Seed Vault", icon: "🌾", steps: ["Inventory saved and purchased seeds.", "Check dates and test older seeds for germination.", "Store packets somewhere cool, dry, and dark."] },
      { label: "Next Season Plan", icon: "📝", steps: ["Review last season’s garden notes.", "Sketch beds and consider crop rotation.", "Plan sowing dates around your local frost dates."] },
      { label: "Seed Wishlist", icon: "📋", steps: ["List varieties you want to try.", "Compare your wishlist with seeds you already have.", "Prioritize crops that fit your space and growing season."] },
      { label: "Indoor Growing", icon: "🌱", steps: ["Choose compact lettuce or herbs for your available space.", "Provide enough light, using a grow light when needed.", "Check moisture and airflow regularly."] },
    ],
  },
};

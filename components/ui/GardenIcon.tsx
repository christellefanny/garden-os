import type { CSSProperties } from "react";

export default function GardenIcon({
  kind = "leaf",
  className = "h-5 w-5",
  style,
}: {
  kind?: string;
  className?: string;
  style?: CSSProperties;
}) {
  const paths: Record<string, string> = {
    leaf: "M19 4C9 3 3 8 5 15c2 7 12 7 14-11ZM5 19 16 8M10 14l-1-5M13 11l5 1",
    seeds:
      "M12 20v-8M12 14C5 14 3 9 4 5c6 0 9 4 8 9ZM12 11c0-5 3-8 8-8 1 5-2 9-8 8",
    frost:
      "M12 3v18M4 7l16 10M4 17 20 7M9 5l3 3 3-3M9 19l3-3 3 3M4 11l4-1-1-4M20 13l-4 1 1 4",
    bed: "M3 12l9-5 9 5-9 5-9-5ZM3 12v5l9 5 9-5v-5M12 17v5M12 7V2M9 4l3 3 3-3",
    water: "M12 3c-2 4-7 8-7 12a7 7 0 0 0 14 0c0-4-5-8-7-12ZM8 15c0 2 1 3 3 3",
    harvest:
      "M3 10h18l-2 10H5L3 10ZM7 10c0-9 10-9 10 0M7 13l1 4M12 13v4M17 13l-1 4",
    pest: "M8 9h8v6a4 4 0 0 1-8 0V9ZM9 9V7a3 3 0 0 1 6 0v2M12 10v9M5 8l3 3M19 8l-3 3M4 14h4M20 14h-4M5 20l3-3M19 20l-3-3",
    log: "M6 3h12v18H6V3ZM9 7h6M9 11h6M9 15h4M3 6h3M3 10h3M3 14h3M3 18h3",
    garlic:
      "M12 3v5M9 5l3 3 3-3M12 8c-4 0-7 5-7 8 0 6 14 6 14 0 0-3-3-8-7-8ZM12 8c-4 5-4 10 0 13M12 8c4 5 4 10 0 13",
    cleanup: "M4 20l9-9M8 16l-4-4 5-6 9 9-6 5-4-4ZM13 11l6-8M11 9l4 4",
    plan: "M4 3h16v18H4V3ZM8 7h3v3H8V7ZM14 7h3M14 10h3M8 14h3v3H8v-3ZM14 14h3M14 17h3",
    indoor:
      "M3 10l9-7 9 7M5 9v12h14V9M12 19v-6M12 15c-4 0-5-2-5-4 4 0 5 2 5 4ZM12 13c0-3 2-5 5-5 0 3-2 5-5 5",
  };
  return (
    <svg
      viewBox="0 0 24 24"
      aria-hidden="true"
      focusable="false"
      className={className}
      style={style}
      fill="none"
      stroke="currentColor"
      strokeWidth="1.35"
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <path d={paths[kind] ?? paths.leaf} />
    </svg>
  );
}

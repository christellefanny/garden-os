import type { MetadataRoute } from "next";
export default function manifest(): MetadataRoute.Manifest {
  return {
    name: "Garden Atelier",
    short_name: "Garden Atelier",
    description:
      "Your personal growing calendar, plant collection and garden journal",
    start_url: "/",
    scope: "/",
    display: "standalone",
    background_color: "#fbf7ed",
    theme_color: "#4b633d",
    icons: [
      { src: "/garden-icon-192.png", sizes: "192x192", type: "image/png" },
      { src: "/garden-icon-512.png", sizes: "512x512", type: "image/png" },
    ],
  };
}

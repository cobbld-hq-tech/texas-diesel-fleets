import type { MetadataRoute } from "next";

export default function manifest(): MetadataRoute.Manifest {
  return {
    name: "Texas Diesel Fleets",
    short_name: "Diesel Fleets",
    description:
      "Heavy-duty diesel repair, fleet maintenance, and DOT inspections in Midland, TX.",
    start_url: "/",
    display: "standalone",
    background_color: "#13181c",
    theme_color: "#13181c",
    icons: [
      { src: "/icon-192.png", sizes: "192x192", type: "image/png", purpose: "any" },
      { src: "/icon-512.png", sizes: "512x512", type: "image/png", purpose: "any" },
      {
        src: "/icon-512.png",
        sizes: "512x512",
        type: "image/png",
        purpose: "maskable",
      },
    ],
  };
}

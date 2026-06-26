import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "Texas Diesel Fleets — Heavy-Duty Diesel Repair · Midland, TX",
  description:
    "Heavy-duty diesel repair, fleet maintenance, and DOT inspections for Midland and the Permian Basin. Locally owned. Straight answers, fair prices, no runaround.",
};

export default function RootLayout({
  children,
}: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="en">
      <head>
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link
          rel="preconnect"
          href="https://fonts.gstatic.com"
          crossOrigin=""
        />
        <link
          href="https://fonts.googleapis.com/css2?family=Oswald:wght@400;500;600;700&family=IBM+Plex+Sans:wght@400;500;600;700&family=IBM+Plex+Mono:wght@400;500;600&family=Stardos+Stencil:wght@400;700&display=swap"
          rel="stylesheet"
        />
      </head>
      <body>{children}</body>
    </html>
  );
}

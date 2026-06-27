import type { Metadata, Viewport } from "next";
import "./globals.css";

const TITLE = "Texas Diesel Fleets — Heavy-Duty Diesel Repair · Midland, TX";
const DESCRIPTION =
  "Heavy-duty diesel repair, fleet maintenance, and DOT inspections for Midland and the Permian Basin. Locally owned. Straight answers, fair prices, no runaround.";

export const metadata: Metadata = {
  metadataBase: new URL("https://texasdieselfleets.com"),
  title: TITLE,
  description: DESCRIPTION,
  keywords: [
    "diesel repair Midland TX",
    "fleet maintenance Permian Basin",
    "DOT inspection",
    "heavy-duty truck repair",
    "DPF cleaning",
  ],
  openGraph: {
    type: "website",
    title: TITLE,
    description: DESCRIPTION,
    siteName: "Texas Diesel Fleets",
    locale: "en_US",
    images: [
      {
        url: "/assets/hero-inspection.jpg",
        width: 1200,
        height: 630,
        alt: "Diesel technician inspecting a truck underbody at Texas Diesel Fleets",
      },
    ],
  },
  twitter: {
    card: "summary_large_image",
    title: TITLE,
    description: DESCRIPTION,
    images: ["/assets/hero-inspection.jpg"],
  },
};

export const viewport: Viewport = {
  themeColor: "#13181c",
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

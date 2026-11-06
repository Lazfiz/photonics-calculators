import type { Metadata, Viewport } from "next";
import { Analytics } from "@vercel/analytics/react";
import { SpeedInsights } from "@vercel/speed-insights/next";
import { totalCalculatorCount } from "@/lib/home-categories";
import { SITE_URL } from "@/lib/site";
import { URL_STATE_PENDING_SCRIPT } from "@/lib/url-state-pending";
import "./globals.css";

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  maximumScale: 5,
  themeColor: "#030712",
};

export const metadata: Metadata = {
  metadataBase: new URL(SITE_URL),
  icons: {
    icon: "/favicon.ico",
    apple: "/icon-192.png",
  },
  manifest: "/manifest.json",
  title: {
    default: `Photonics Calculators - ${totalCalculatorCount} Interactive Optics Tools`,
    template: "%s | Photonics Calculators",
  },
  description: "Free interactive calculators and simulators for optics, photonics, laser safety, fiber optics, thin films, imaging, spectroscopy, and more.",
  keywords: ["photonics", "optics", "calculators", "laser", "fiber optics", "spectroscopy", "thin film"],
  alternates: {
    canonical: "/",
  },
  verification: {
    google: "uoBMhGut5O-xS5GOcJiBjqjRjc3MihvTaM2ycXafe9Q",
  },
  openGraph: {
    title: {
      default: "Photonics Calculators",
      template: "%s | Photonics Calculators",
    },
    description: `${totalCalculatorCount} interactive photonics, optics & laser tools — free and open source.`,
    type: "website",
    siteName: "Photonics Calculators",
    locale: "en_US",
    url: SITE_URL,
  },
  twitter: {
    card: "summary_large_image",
    title: {
      default: "Photonics Calculators",
      template: "%s | Photonics Calculators",
    },
    description: `${totalCalculatorCount} interactive photonics, optics & laser tools — free and open source.`,
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    // The URL-state script sets an attribute on <html> before hydration.
    <html lang="en" className="dark" suppressHydrationWarning>
      <body className="bg-gray-950 text-gray-100 antialiased">
        <script dangerouslySetInnerHTML={{ __html: URL_STATE_PENDING_SCRIPT }} />
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{
            __html: JSON.stringify({
              "@context": "https://schema.org",
              "@type": "WebApplication",
              name: "Photonics Calculators",
              description: `${totalCalculatorCount} interactive calculators and simulators for optics, photonics, laser safety, fiber optics, thin films, imaging, and spectroscopy.`,
              applicationCategory: "UtilitiesApplication",
              operatingSystem: "Any",
              offers: { "@type": "Offer", price: "0", priceCurrency: "USD" },
              url: SITE_URL,
            }),
          }}
        />
        {children}
        <Analytics />
        <SpeedInsights />
      </body>
    </html>
  );
}

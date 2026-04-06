import type { Metadata, Viewport } from "next";
import "./globals.css";

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  maximumScale: 5,
  themeColor: "#030712",
};

const siteUrl = process.env.NEXT_PUBLIC_SITE_URL || "https://photonics-calculators.vercel.app";

export const metadata: Metadata = {
  metadataBase: new URL(siteUrl),
  title: {
    default: "Photonics Calculators - 541 Interactive Optics Tools",
    template: "%s | Photonics Calculators",
  },
  description: "Free interactive calculators and simulators for optics, photonics, laser safety, fiber optics, thin films, imaging, spectroscopy, and more.",
  keywords: ["photonics", "optics", "calculators", "laser", "fiber optics", "spectroscopy", "thin film"],
  alternates: {
    canonical: "/",
  },
  openGraph: {
    title: {
      default: "Photonics Calculators",
      template: "%s | Photonics Calculators",
    },
    description: "541 interactive photonics, optics & laser tools — free and open source.",
    type: "website",
    siteName: "Photonics Calculators",
    locale: "en_US",
    url: siteUrl,
  },
  twitter: {
    card: "summary_large_image",
    title: {
      default: "Photonics Calculators",
      template: "%s | Photonics Calculators",
    },
    description: "541 interactive photonics, optics & laser tools — free and open source.",
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" className="dark">
      <body className="bg-gray-950 text-gray-100 antialiased">
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{
            __html: JSON.stringify({
              "@context": "https://schema.org",
              "@type": "WebApplication",
              name: "Photonics Calculators",
              description: "541 interactive calculators and simulators for optics, photonics, laser safety, fiber optics, thin films, imaging, and spectroscopy.",
              applicationCategory: "UtilitiesApplication",
              operatingSystem: "Any",
              offers: { "@type": "Offer", price: "0", priceCurrency: "USD" },
              url: process.env.NEXT_PUBLIC_SITE_URL || "https://photonics-calculators.vercel.app",
            }),
          }}
        />
        {children}
      </body>
    </html>
  );
}

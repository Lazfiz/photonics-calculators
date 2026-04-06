import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: {
    default: "Photonics Calculators - 541 Interactive Optics Tools",
    template: "%s | Photonics Calculators",
  },
  description: "Free interactive calculators and simulators for optics, photonics, laser safety, fiber optics, thin films, imaging, spectroscopy, and more.",
  keywords: ["photonics", "optics", "calculators", "laser", "fiber optics", "spectroscopy", "thin film"],
  openGraph: {
    title: "Photonics Calculators",
    description: "541 interactive photonics, optics & laser tools — free and open source.",
    type: "website",
    siteName: "Photonics Calculators",
    locale: "en_US",
  },
  twitter: {
    card: "summary_large_image",
    title: "Photonics Calculators",
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
        {children}
      </body>
    </html>
  );
}

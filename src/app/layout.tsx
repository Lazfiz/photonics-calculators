import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "Photonics Calculators - 100+ Interactive Optics Tools",
  description: "Free interactive calculators and simulators for optics, photonics, laser safety, fiber optics, thin films, imaging, spectroscopy, and more.",
  keywords: ["photonics", "optics", "calculators", "laser", "fiber optics", "spectroscopy", "thin film"],
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

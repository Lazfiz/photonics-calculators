import type { Metadata } from "next";
import PageClient from "./page-client";

export const metadata: Metadata = {
    alternates: { canonical: 'https://photonics-calculators.vercel.app/materials/optical-glass-catalog' },
      title: 'Optical Glass Catalog',
  description: 'Interactive glass map and dispersion curves. Sellmeier: n²() = 1 + Σ Bi²/(² - Ci)',
};

export default function Page() {
  return <PageClient />;
}

import type { Metadata } from "next";
import PageClient from "./page-client";

export const metadata: Metadata = {
    alternates: { canonical: 'https://photonics-calculators.vercel.app/thin-film/metal-dielectric' },
    title: 'Metal-Dielectric Coatings',
  description: 'Metal-dielectric coating design. Explore how a dielectric overcoat modifies the reflectance, transmittance, and absorptance of a thin metal layer.'
};

export default function Page() {
  return <PageClient />;
}

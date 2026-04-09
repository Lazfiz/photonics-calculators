import type { Metadata } from "next";
import PageClient from "./page-client";

export const metadata: Metadata = {
    canonical: "https://photonics-calculators.vercel.app/materials/schott-glass",
      title: 'Schott Glass Catalog',
  description: 'Refractive index n() from SCHOTT Sellmeier coefficients',
};

export default function Page() {
  return <PageClient />;
}

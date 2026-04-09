import type { Metadata } from "next";
import PageClient from "./page-client";

export const metadata: Metadata = {
    alternates: { canonical: 'https://photonics-calculators.vercel.app/materials/chromatic-dispersion' },
      title: 'Chromatic Dispersion',
  description: 'Material dispersion dn/d from Sellmeier coefficients',
};

export default function Page() {
  return <PageClient />;
}

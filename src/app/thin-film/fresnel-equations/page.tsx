import type { Metadata } from "next";
import { generateCalculatorJsonLd, JsonLdScript } from '../../../lib/json-ld';
import PageClient from "./page-client";

export const metadata: Metadata = {
    alternates: { canonical: 'https://photonics-calculators.vercel.app/thin-film/fresnel-equations' },
    title: 'Fresnel Equations',
  description: "Reflectance vs. angle of incidence at a dielectric interface. Shows s-polarization, p-polarization, Brewster's angle, and total internal reflection."
};

const jsonLd = generateCalculatorJsonLd(
  'Fresnel Equations',
  "Reflectance vs. angle of incidence at a dielectric interface. Shows s-polarization, p-polarization, Brewster's angle, and total internal reflection.",
  'https://photonics-calculators.vercel.app/thin-film/fresnel-equations',
  { category: 'Thin Film' }
);

export default function Page() {
  return (
    <>
      <JsonLdScript data={jsonLd} />
      <PageClient />
    </>
  );
}

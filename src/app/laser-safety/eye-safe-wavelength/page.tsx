import type { Metadata } from "next";
import { generateCalculatorJsonLd, JsonLdScript } from '../../../lib/json-ld';
import PageClient from "./page-client";

export const metadata: Metadata = {
    alternates: { canonical: 'https://photonics-calculators.vercel.app/laser-safety/eye-safe-wavelength' },
    title: 'Eye-Safe Wavelength',
  description: "Identifies the eye-safe wavelength bands (1400\u20131500 nm, 1500\u20131800 nm) where corneal absorption protects the retina. Compare your laser's fluence against spectral MPE."
};

const jsonLd = generateCalculatorJsonLd(
  'Eye-Safe Wavelength',
  "Identifies the eye-safe wavelength bands (1400\u20131500 nm, 1500\u20131800 nm) where corneal absorption protects the retina. Compare your laser's fluence against spectral MPE.",
  'https://photonics-calculators.vercel.app/laser-safety/eye-safe-wavelength',
  { category: 'Laser Safety' }
);

export default function Page() {
  return (
    <>
      <JsonLdScript data={jsonLd} />
      <PageClient />
    </>
  );
}

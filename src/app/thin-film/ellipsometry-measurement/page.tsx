import type { Metadata } from "next";
import { generateCalculatorJsonLd, JsonLdScript } from '../../../lib/json-ld';
import PageClient from "./page-client";

export const metadata: Metadata = {
    alternates: { canonical: 'https://photonics-calculators.vercel.app/thin-film/ellipsometry-measurement' },
    title: 'Ellipsometry Measurement',
  description: 'Invert ellipsometry data (Psi, Delta) to the pseudo-dielectric function and pseudo-refractive index of a substrate.'
};

const jsonLd = generateCalculatorJsonLd(
  'Ellipsometry Measurement',
  'Invert ellipsometry data (Psi, Delta) to the pseudo-dielectric function and pseudo-refractive index of a substrate.',
  'https://photonics-calculators.vercel.app/thin-film/ellipsometry-measurement',
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

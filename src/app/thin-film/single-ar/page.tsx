import type { Metadata } from "next";
import { generateCalculatorJsonLd, JsonLdScript } from '../../../lib/json-ld';
import PageClient from "./page-client";

export const metadata: Metadata = {
    alternates: { canonical: 'https://photonics-calculators.vercel.app/thin-film/single-ar' },
    title: 'Single Layer AR Coating',
    description: "Quarter-wave antireflection coating design with Snell's law and explicit s/p polarization handling at oblique incidence."
};

const jsonLd = generateCalculatorJsonLd(
  'Single Layer AR Coating',
  "Quarter-wave antireflection coating design with Snell's law and explicit s/p polarization handling at oblique incidence.",
  'https://photonics-calculators.vercel.app/thin-film/single-ar',
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

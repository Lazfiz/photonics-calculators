import type { Metadata } from "next";
import { generateCalculatorJsonLd, JsonLdScript } from '../../../lib/json-ld';
import PageClient from "./page-client";

export const metadata: Metadata = {
    alternates: { canonical: 'https://photonics-calculators.vercel.app/laser-safety/corneal-vs-retinal' },
    title: 'Corneal vs Retinal Limits',
  description: "Compares corneal MPE with equivalent retinal irradiance, showing the eye's focusing gain and which limit governs."
};

const jsonLd = generateCalculatorJsonLd(
  'Corneal vs Retinal Limits',
  "Compares corneal MPE with equivalent retinal irradiance, showing the eye's focusing gain and which limit governs.",
  'https://photonics-calculators.vercel.app/laser-safety/corneal-vs-retinal',
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

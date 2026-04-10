import type { Metadata } from "next";
import { generateCalculatorJsonLd, JsonLdScript } from '../../../lib/json-ld';
import PageClient from "./page-client";

export const metadata: Metadata = {
    alternates: { canonical: 'https://photonics-calculators.vercel.app/detectors/responsivity' },
    title: 'Detector Responsivity',
    description: 'Detector responsivity from quantum efficiency and wavelength with wavelength sweep.'
};

const jsonLd = generateCalculatorJsonLd(
  'Detector Responsivity',
  'Detector responsivity from quantum efficiency and wavelength with wavelength sweep.',
  'https://photonics-calculators.vercel.app/detectors/responsivity',
  { category: 'Detectors' }
);

export default function Page() {
  return (
    <>
      <JsonLdScript data={jsonLd} />
      <PageClient />
    </>
  );
}

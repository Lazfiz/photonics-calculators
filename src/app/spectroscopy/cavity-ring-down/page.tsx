import type { Metadata } from "next";
import { generateCalculatorJsonLd, JsonLdScript } from '../../../lib/json-ld';
import PageClient from "./page-client";

export const metadata: Metadata = {
    alternates: { canonical: 'https://photonics-calculators.vercel.app/spectroscopy/cavity-ring-down' },
    title: 'Cavity Ring-Down Spectroscopy',
  description: 'Model CRDS ring-down time, sensitivity, and finesse. Visualize exponential decay with and without sample absorption.'
};
const jsonLd = generateCalculatorJsonLd(
  `Cavity Ring-Down Spectroscopy',
  description: 'Model CRDS ring-down time, sensitivity, and finesse. Visualize exponential decay with and without sample absorption.'
};


const jsonLd = generateCalculatorJsonLd(
  'Cavity Ring-Down Spectroscopy',
  'Model CRDS ring-down time, sensitivity, and finesse. Visualize exponential decay with and without sample absorption.',
  'https://photonics-calculators.vercel.app/spectroscopy/cavity-ring-down',
  { category: 'Spectroscopy`,
  `Model CRDS ring-down time, sensitivity, and finesse. Visualize exponential decay with and without sample absorption.'
};


const jsonLd = generateCalculatorJsonLd(
  'Cavity Ring-Down Spectroscopy',
  'Model CRDS ring-down time, sensitivity, and finesse. Visualize exponential decay with and without sample absorption.',
  'https://photonics-calculators.vercel.app/spectroscopy/cavity-ring-down',
  { category: 'Spectroscopy`,
  `https://photonics-calculators.vercel.app/spectroscopy/cavity-ring-down`,
  { category: `Spectroscopy` }
);
export default function Page() {
  return (
    <>
      <JsonLdScript data={jsonLd} />
      <PageClient />
    </>
  );
}

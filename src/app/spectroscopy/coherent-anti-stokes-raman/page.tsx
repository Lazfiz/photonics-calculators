import type { Metadata } from "next";
import { generateCalculatorJsonLd, JsonLdScript } from '../../../lib/json-ld';
import PageClient from "./page-client";

export const metadata: Metadata = {
    alternates: { canonical: 'https://photonics-calculators.vercel.app/spectroscopy/coherent-anti-stokes-raman' },
    title: 'Coherent Anti-Stokes Raman Scattering (CARS)',
  description: 'Four-wave mixing process for label-free vibrational imaging with chemical specificity.'
};
const jsonLd = generateCalculatorJsonLd(
  `Coherent Anti-Stokes Raman Scattering (CARS)',
  description: 'Four-wave mixing process for label-free vibrational imaging with chemical specificity.'
};


const jsonLd = generateCalculatorJsonLd(
  'Coherent Anti-Stokes Raman Scattering (CARS)',
  'Four-wave mixing process for label-free vibrational imaging with chemical specificity.',
  'https://photonics-calculators.vercel.app/spectroscopy/coherent-anti-stokes-raman',
  { category: 'Spectroscopy`,
  `Four-wave mixing process for label-free vibrational imaging with chemical specificity.'
};


const jsonLd = generateCalculatorJsonLd(
  'Coherent Anti-Stokes Raman Scattering (CARS)',
  'Four-wave mixing process for label-free vibrational imaging with chemical specificity.',
  'https://photonics-calculators.vercel.app/spectroscopy/coherent-anti-stokes-raman',
  { category: 'Spectroscopy`,
  `https://photonics-calculators.vercel.app/spectroscopy/coherent-anti-stokes-raman`,
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

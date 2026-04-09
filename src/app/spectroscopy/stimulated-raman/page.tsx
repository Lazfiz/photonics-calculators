import type { Metadata } from "next";
import { generateCalculatorJsonLd, JsonLdScript } from '../../../lib/json-ld';
import PageClient from "./page-client";

export const metadata: Metadata = {
    alternates: { canonical: 'https://photonics-calculators.vercel.app/spectroscopy/stimulated-raman' },
    title: 'Stimulated Raman Scattering (SRS)',
  description: 'Coherent Raman gain/loss process for high-speed chemical imaging without non-resonant background.'
};
const jsonLd = generateCalculatorJsonLd(
  `Stimulated Raman Scattering (SRS)',
  description: 'Coherent Raman gain/loss process for high-speed chemical imaging without non-resonant background.'
};


const jsonLd = generateCalculatorJsonLd(
  'Stimulated Raman Scattering (SRS)',
  'Coherent Raman gain/loss process for high-speed chemical imaging without non-resonant background.',
  'https://photonics-calculators.vercel.app/spectroscopy/stimulated-raman',
  { category: 'Spectroscopy`,
  `Coherent Raman gain/loss process for high-speed chemical imaging without non-resonant background.'
};


const jsonLd = generateCalculatorJsonLd(
  'Stimulated Raman Scattering (SRS)',
  'Coherent Raman gain/loss process for high-speed chemical imaging without non-resonant background.',
  'https://photonics-calculators.vercel.app/spectroscopy/stimulated-raman',
  { category: 'Spectroscopy`,
  `https://photonics-calculators.vercel.app/spectroscopy/stimulated-raman`,
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

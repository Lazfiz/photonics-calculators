import type { Metadata } from "next";
import { generateCalculatorJsonLd, JsonLdScript } from '../../../lib/json-ld';
import PageClient from "./page-client";

export const metadata: Metadata = {
    alternates: { canonical: 'https://photonics-calculators.vercel.app/spectroscopy/pump-probe' },
    title: 'Pump-Probe Spectroscopy',
  description: 'Ultrafast dynamics via time-resolved differential transmission. GSB, SE, and ESA contributions.'
};
const jsonLd = generateCalculatorJsonLd(
  `Pump-Probe Spectroscopy',
  description: 'Ultrafast dynamics via time-resolved differential transmission. GSB, SE, and ESA contributions.'
};


const jsonLd = generateCalculatorJsonLd(
  'Pump-Probe Spectroscopy',
  'Ultrafast dynamics via time-resolved differential transmission. GSB, SE, and ESA contributions.',
  'https://photonics-calculators.vercel.app/spectroscopy/pump-probe',
  { category: 'Spectroscopy`,
  `Ultrafast dynamics via time-resolved differential transmission. GSB, SE, and ESA contributions.'
};


const jsonLd = generateCalculatorJsonLd(
  'Pump-Probe Spectroscopy',
  'Ultrafast dynamics via time-resolved differential transmission. GSB, SE, and ESA contributions.',
  'https://photonics-calculators.vercel.app/spectroscopy/pump-probe',
  { category: 'Spectroscopy`,
  `https://photonics-calculators.vercel.app/spectroscopy/pump-probe`,
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

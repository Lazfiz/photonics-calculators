import type { Metadata } from "next";
import { generateCalculatorJsonLd, JsonLdScript } from '../../../lib/json-ld';
import PageClient from "./page-client";

export const metadata: Metadata = {
    alternates: { canonical: 'https://photonics-calculators.vercel.app/spectroscopy/optical-path-length' },
      title: 'Optical Path Length Calculator',
  description: 'OPL = n d N / cos() — effective path through a medium.',
};
const jsonLd = generateCalculatorJsonLd(
  `Optical Path Length Calculator',
  description: 'OPL = n d N / cos() — effective path through a medium.',
};


const jsonLd = generateCalculatorJsonLd(
  'Optical Path Length Calculator',
  'OPL = n d N / cos() — effective path through a medium.',
  'https://photonics-calculators.vercel.app/spectroscopy/optical-path-length',
  { category: 'Spectroscopy`,
  `OPL = n d N / cos() — effective path through a medium.',
};


const jsonLd = generateCalculatorJsonLd(
  'Optical Path Length Calculator',
  'OPL = n d N / cos() — effective path through a medium.',
  'https://photonics-calculators.vercel.app/spectroscopy/optical-path-length',
  { category: 'Spectroscopy`,
  `https://photonics-calculators.vercel.app/spectroscopy/optical-path-length`,
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

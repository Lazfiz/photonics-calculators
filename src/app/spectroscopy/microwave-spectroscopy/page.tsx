import type { Metadata } from "next";
import { generateCalculatorJsonLd, JsonLdScript } from '../../../lib/json-ld';
import PageClient from "./page-client";

export const metadata: Metadata = {
    alternates: { canonical: 'https://photonics-calculators.vercel.app/spectroscopy/microwave-spectroscopy' },
    title: 'Microwave / Rotational Spectroscopy',
  description: 'Pure rotational transitions for molecular structure determination (1–300 GHz).',
};
const jsonLd = generateCalculatorJsonLd(
  `Microwave / Rotational Spectroscopy',
  description: 'Pure rotational transitions for molecular structure determination (1–300 GHz).',
};


const jsonLd = generateCalculatorJsonLd(
  'Microwave / Rotational Spectroscopy',
  'Pure rotational transitions for molecular structure determination (1–300 GHz).',
  'https://photonics-calculators.vercel.app/spectroscopy/microwave-spectroscopy',
  { category: 'Spectroscopy`,
  `Pure rotational transitions for molecular structure determination (1–300 GHz).',
};


const jsonLd = generateCalculatorJsonLd(
  'Microwave / Rotational Spectroscopy',
  'Pure rotational transitions for molecular structure determination (1–300 GHz).',
  'https://photonics-calculators.vercel.app/spectroscopy/microwave-spectroscopy',
  { category: 'Spectroscopy`,
  `https://photonics-calculators.vercel.app/spectroscopy/microwave-spectroscopy`,
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

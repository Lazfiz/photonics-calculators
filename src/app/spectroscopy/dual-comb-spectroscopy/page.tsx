import type { Metadata } from "next";
import { generateCalculatorJsonLd, JsonLdScript } from '../../../lib/json-ld';
import PageClient from "./page-client";

export const metadata: Metadata = {
    alternates: { canonical: 'https://photonics-calculators.vercel.app/spectroscopy/dual-comb-spectroscopy' },
    title: 'Dual-Comb Spectroscopy Calculator',
  description: 'Model dual-comb spectroscopy parameters: resolution, bandwidth, update rate, and multi-heterodyne RF spectrum.'
};
const jsonLd = generateCalculatorJsonLd(
  `Dual-Comb Spectroscopy Calculator',
  description: 'Model dual-comb spectroscopy parameters: resolution, bandwidth, update rate, and multi-heterodyne RF spectrum.'
};


const jsonLd = generateCalculatorJsonLd(
  'Dual-Comb Spectroscopy Calculator',
  'Model dual-comb spectroscopy parameters: resolution, bandwidth, update rate, and multi-heterodyne RF spectrum.',
  'https://photonics-calculators.vercel.app/spectroscopy/dual-comb-spectroscopy',
  { category: 'Spectroscopy`,
  `Model dual-comb spectroscopy parameters: resolution, bandwidth, update rate, and multi-heterodyne RF spectrum.'
};


const jsonLd = generateCalculatorJsonLd(
  'Dual-Comb Spectroscopy Calculator',
  'Model dual-comb spectroscopy parameters: resolution, bandwidth, update rate, and multi-heterodyne RF spectrum.',
  'https://photonics-calculators.vercel.app/spectroscopy/dual-comb-spectroscopy',
  { category: 'Spectroscopy`,
  `https://photonics-calculators.vercel.app/spectroscopy/dual-comb-spectroscopy`,
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

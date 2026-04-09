import type { Metadata } from "next";
import { generateCalculatorJsonLd, JsonLdScript } from '../../../lib/json-ld';
import PageClient from "./page-client";

export const metadata: Metadata = {
    alternates: { canonical: 'https://photonics-calculators.vercel.app/spectroscopy/conc-mirror' },
    title: 'Concave Mirror Throughput',
  description: 'Connes advantage and throughput for concave mirror-based spectrometers (e.g., FTIR, concave grating).',
};
const jsonLd = generateCalculatorJsonLd(
  `Concave Mirror Throughput',
  description: 'Connes advantage and throughput for concave mirror-based spectrometers (e.g., FTIR, concave grating).',
};


const jsonLd = generateCalculatorJsonLd(
  'Concave Mirror Throughput',
  'Connes advantage and throughput for concave mirror-based spectrometers (e.g., FTIR, concave grating).',
  'https://photonics-calculators.vercel.app/spectroscopy/conc-mirror',
  { category: 'Spectroscopy`,
  `Connes advantage and throughput for concave mirror-based spectrometers (e.g., FTIR, concave grating).',
};


const jsonLd = generateCalculatorJsonLd(
  'Concave Mirror Throughput',
  'Connes advantage and throughput for concave mirror-based spectrometers (e.g., FTIR, concave grating).',
  'https://photonics-calculators.vercel.app/spectroscopy/conc-mirror',
  { category: 'Spectroscopy`,
  `https://photonics-calculators.vercel.app/spectroscopy/conc-mirror`,
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

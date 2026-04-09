import type { Metadata } from "next";
import { generateCalculatorJsonLd, JsonLdScript } from '../../../lib/json-ld';
import PageClient from "./page-client";

export const metadata: Metadata = {
    alternates: { canonical: 'https://photonics-calculators.vercel.app/spectroscopy/surface-enhanced-raman' },
    title: 'Surface-Enhanced Raman Spectroscopy (SERS)',
  description: 'EM and chemical enhancement mechanisms, hotspots, and detection limit estimation.'
};
const jsonLd = generateCalculatorJsonLd(
  `Surface-Enhanced Raman Spectroscopy (SERS)',
  description: 'EM and chemical enhancement mechanisms, hotspots, and detection limit estimation.'
};


const jsonLd = generateCalculatorJsonLd(
  'Surface-Enhanced Raman Spectroscopy (SERS)',
  'EM and chemical enhancement mechanisms, hotspots, and detection limit estimation.',
  'https://photonics-calculators.vercel.app/spectroscopy/surface-enhanced-raman',
  { category: 'Spectroscopy`,
  `EM and chemical enhancement mechanisms, hotspots, and detection limit estimation.'
};


const jsonLd = generateCalculatorJsonLd(
  'Surface-Enhanced Raman Spectroscopy (SERS)',
  'EM and chemical enhancement mechanisms, hotspots, and detection limit estimation.',
  'https://photonics-calculators.vercel.app/spectroscopy/surface-enhanced-raman',
  { category: 'Spectroscopy`,
  `https://photonics-calculators.vercel.app/spectroscopy/surface-enhanced-raman`,
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

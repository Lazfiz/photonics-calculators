import type { Metadata } from "next";
import { generateCalculatorJsonLd, JsonLdScript } from '../../../lib/json-ld';
import PageClient from "./page-client";

export const metadata: Metadata = {
    alternates: { canonical: 'https://photonics-calculators.vercel.app/detectors/intensified-camera' },
    title: 'Intensified Camera (ICCD)',
  description: 'Gain chain: photocathode MCP phosphor fiber optic CCD. Noise and sensitivity analysis.'
};
const jsonLd = generateCalculatorJsonLd(
  `Intensified Camera (ICCD)',
  description: 'Gain chain: photocathode MCP phosphor fiber optic CCD. Noise and sensitivity analysis.'
};


const jsonLd = generateCalculatorJsonLd(
  'Intensified Camera (ICCD)',
  'Gain chain: photocathode MCP phosphor fiber optic CCD. Noise and sensitivity analysis.',
  'https://photonics-calculators.vercel.app/detectors/intensified-camera',
  { category: 'Detectors`,
  `Gain chain: photocathode MCP phosphor fiber optic CCD. Noise and sensitivity analysis.'
};


const jsonLd = generateCalculatorJsonLd(
  'Intensified Camera (ICCD)',
  'Gain chain: photocathode MCP phosphor fiber optic CCD. Noise and sensitivity analysis.',
  'https://photonics-calculators.vercel.app/detectors/intensified-camera',
  { category: 'Detectors`,
  `https://photonics-calculators.vercel.app/detectors/intensified-camera`,
  { category: `Detectors` }
);
export default function Page() {
  return (
    <>
      <JsonLdScript data={jsonLd} />
      <PageClient />
    </>
  );
}

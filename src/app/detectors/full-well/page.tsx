import type { Metadata } from "next";
import { generateCalculatorJsonLd, JsonLdScript } from '../../../lib/json-ld';
import PageClient from "./page-client";

export const metadata: Metadata = {
    alternates: { canonical: 'https://photonics-calculators.vercel.app/detectors/full-well' },
    title: 'Full Well Capacity vs SNR',
  description: 'Analyze how full well capacity affects signal-to-noise ratio and dynamic range.'
};
const jsonLd = generateCalculatorJsonLd(
  `Full Well Capacity vs SNR',
  description: 'Analyze how full well capacity affects signal-to-noise ratio and dynamic range.'
};


const jsonLd = generateCalculatorJsonLd(
  'Full Well Capacity vs SNR',
  'Analyze how full well capacity affects signal-to-noise ratio and dynamic range.',
  'https://photonics-calculators.vercel.app/detectors/full-well',
  { category: 'Detectors`,
  `Analyze how full well capacity affects signal-to-noise ratio and dynamic range.'
};


const jsonLd = generateCalculatorJsonLd(
  'Full Well Capacity vs SNR',
  'Analyze how full well capacity affects signal-to-noise ratio and dynamic range.',
  'https://photonics-calculators.vercel.app/detectors/full-well',
  { category: 'Detectors`,
  `https://photonics-calculators.vercel.app/detectors/full-well`,
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

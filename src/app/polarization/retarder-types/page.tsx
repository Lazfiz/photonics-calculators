import type { Metadata } from "next";
import { generateCalculatorJsonLd, JsonLdScript } from '../../../lib/json-ld';
import PageClient from "./page-client";

export const metadata: Metadata = {
    alternates: { canonical: 'https://photonics-calculators.vercel.app/polarization/retarder-types' },
    title: 'Retarder Types Comparison',
  description: 'Compare waveplate and retarder types: bandwidth, accuracy, temperature sensitivity.'
};
const jsonLd = generateCalculatorJsonLd(
  `Retarder Types Comparison',
  description: 'Compare waveplate and retarder types: bandwidth, accuracy, temperature sensitivity.'
};


const jsonLd = generateCalculatorJsonLd(
  'Retarder Types Comparison',
  'Compare waveplate and retarder types: bandwidth, accuracy, temperature sensitivity.',
  'https://photonics-calculators.vercel.app/polarization/retarder-types',
  { category: 'Polarization`,
  `Compare waveplate and retarder types: bandwidth, accuracy, temperature sensitivity.'
};


const jsonLd = generateCalculatorJsonLd(
  'Retarder Types Comparison',
  'Compare waveplate and retarder types: bandwidth, accuracy, temperature sensitivity.',
  'https://photonics-calculators.vercel.app/polarization/retarder-types',
  { category: 'Polarization`,
  `https://photonics-calculators.vercel.app/polarization/retarder-types`,
  { category: `Polarization` }
);
export default function Page() {
  return (
    <>
      <JsonLdScript data={jsonLd} />
      <PageClient />
    </>
  );
}

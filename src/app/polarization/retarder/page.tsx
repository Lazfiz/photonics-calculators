import type { Metadata } from "next";
import { generateCalculatorJsonLd, JsonLdScript } from '../../../lib/json-ld';
import PageClient from "./page-client";

export const metadata: Metadata = {
    alternates: { canonical: 'https://photonics-calculators.vercel.app/polarization/retarder' },
    title: 'Waveplate / Retarder',
  description: 'Polarization state transformation by a birefringent waveplate with variable retardance and fast-axis orientation.'
};
const jsonLd = generateCalculatorJsonLd(
  `Waveplate / Retarder',
  description: 'Polarization state transformation by a birefringent waveplate with variable retardance and fast-axis orientation.'
};


const jsonLd = generateCalculatorJsonLd(
  'Waveplate / Retarder',
  'Polarization state transformation by a birefringent waveplate with variable retardance and fast-axis orientation.',
  'https://photonics-calculators.vercel.app/polarization/retarder',
  { category: 'Polarization`,
  `Polarization state transformation by a birefringent waveplate with variable retardance and fast-axis orientation.'
};


const jsonLd = generateCalculatorJsonLd(
  'Waveplate / Retarder',
  'Polarization state transformation by a birefringent waveplate with variable retardance and fast-axis orientation.',
  'https://photonics-calculators.vercel.app/polarization/retarder',
  { category: 'Polarization`,
  `https://photonics-calculators.vercel.app/polarization/retarder`,
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

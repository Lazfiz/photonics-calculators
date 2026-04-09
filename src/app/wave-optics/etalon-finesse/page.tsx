import type { Metadata } from "next";
import { generateCalculatorJsonLd, JsonLdScript } from '../../../lib/json-ld';
import PageClient from "./page-client";

export const metadata: Metadata = {
    alternates: { canonical: 'https://photonics-calculators.vercel.app/wave-optics/etalon-finesse' },
    title: 'Etalon / Fabry-Pérot Analysis',
  description: 'Detailed etalon transmission, finesse, and spectral properties.'
};
const jsonLd = generateCalculatorJsonLd(
  `Etalon / Fabry-Pérot Analysis',
  description: 'Detailed etalon transmission, finesse, and spectral properties.'
};


const jsonLd = generateCalculatorJsonLd(
  'Etalon / Fabry-Pérot Analysis',
  'Detailed etalon transmission, finesse, and spectral properties.',
  'https://photonics-calculators.vercel.app/wave-optics/etalon-finesse',
  { category: 'Wave Optics`,
  `Detailed etalon transmission, finesse, and spectral properties.'
};


const jsonLd = generateCalculatorJsonLd(
  'Etalon / Fabry-Pérot Analysis',
  'Detailed etalon transmission, finesse, and spectral properties.',
  'https://photonics-calculators.vercel.app/wave-optics/etalon-finesse',
  { category: 'Wave Optics`,
  `https://photonics-calculators.vercel.app/wave-optics/etalon-finesse`,
  { category: `Wave Optics` }
);
export default function Page() {
  return (
    <>
      <JsonLdScript data={jsonLd} />
      <PageClient />
    </>
  );
}

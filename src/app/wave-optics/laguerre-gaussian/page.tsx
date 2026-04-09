import type { Metadata } from "next";
import { generateCalculatorJsonLd, JsonLdScript } from '../../../lib/json-ld';
import PageClient from "./page-client";

export const metadata: Metadata = {
    alternates: { canonical: 'https://photonics-calculators.vercel.app/wave-optics/laguerre-gaussian' },
    title: 'Laguerre-Gaussian Modes',
  description: 'Donut modes with orbital angular momentum.'
};
const jsonLd = generateCalculatorJsonLd(
  `Laguerre-Gaussian Modes',
  description: 'Donut modes with orbital angular momentum.'
};


const jsonLd = generateCalculatorJsonLd(
  'Laguerre-Gaussian Modes',
  'Donut modes with orbital angular momentum.',
  'https://photonics-calculators.vercel.app/wave-optics/laguerre-gaussian',
  { category: 'Wave Optics`,
  `Donut modes with orbital angular momentum.'
};


const jsonLd = generateCalculatorJsonLd(
  'Laguerre-Gaussian Modes',
  'Donut modes with orbital angular momentum.',
  'https://photonics-calculators.vercel.app/wave-optics/laguerre-gaussian',
  { category: 'Wave Optics`,
  `https://photonics-calculators.vercel.app/wave-optics/laguerre-gaussian`,
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

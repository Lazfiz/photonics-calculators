import type { Metadata } from "next";
import { generateCalculatorJsonLd, JsonLdScript } from '../../../lib/json-ld';
import PageClient from "./page-client";

export const metadata: Metadata = {
    alternates: { canonical: 'https://photonics-calculators.vercel.app/detectors/dark-noise-temperature' },
    title: 'Dark Noise vs Temperature',
  description: 'Temperature dependence of dark current and dark noise in photodiodes/CCDs.'
};
const jsonLd = generateCalculatorJsonLd(
  `Dark Noise vs Temperature',
  description: 'Temperature dependence of dark current and dark noise in photodiodes/CCDs.'
};


const jsonLd = generateCalculatorJsonLd(
  'Dark Noise vs Temperature',
  'Temperature dependence of dark current and dark noise in photodiodes/CCDs.',
  'https://photonics-calculators.vercel.app/detectors/dark-noise-temperature',
  { category: 'Detectors`,
  `Temperature dependence of dark current and dark noise in photodiodes/CCDs.'
};


const jsonLd = generateCalculatorJsonLd(
  'Dark Noise vs Temperature',
  'Temperature dependence of dark current and dark noise in photodiodes/CCDs.',
  'https://photonics-calculators.vercel.app/detectors/dark-noise-temperature',
  { category: 'Detectors`,
  `https://photonics-calculators.vercel.app/detectors/dark-noise-temperature`,
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

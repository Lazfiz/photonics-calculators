import type { Metadata } from "next";
import { generateCalculatorJsonLd, JsonLdScript } from '../../../lib/json-ld';
import PageClient from "./page-client";

export const metadata: Metadata = {
    alternates: { canonical: 'https://photonics-calculators.vercel.app/detectors/thermal-noise' },
    title: 'Johnson (Thermal) Noise',
  description: 'vn = (4kBTRf). Thermal noise voltage across a resistor.'
};
const jsonLd = generateCalculatorJsonLd(
  `Johnson (Thermal) Noise',
  description: 'vn = (4kBTRf). Thermal noise voltage across a resistor.'
};


const jsonLd = generateCalculatorJsonLd(
  'Johnson (Thermal) Noise',
  'vn = (4kBTRf). Thermal noise voltage across a resistor.',
  'https://photonics-calculators.vercel.app/detectors/thermal-noise',
  { category: 'Detectors`,
  `vn = (4kBTRf). Thermal noise voltage across a resistor.'
};


const jsonLd = generateCalculatorJsonLd(
  'Johnson (Thermal) Noise',
  'vn = (4kBTRf). Thermal noise voltage across a resistor.',
  'https://photonics-calculators.vercel.app/detectors/thermal-noise',
  { category: 'Detectors`,
  `https://photonics-calculators.vercel.app/detectors/thermal-noise`,
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

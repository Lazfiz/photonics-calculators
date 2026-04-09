import type { Metadata } from "next";
import { generateCalculatorJsonLd, JsonLdScript } from '../../../lib/json-ld';
import PageClient from "./page-client";

export const metadata: Metadata = {
    alternates: { canonical: 'https://photonics-calculators.vercel.app/spectroscopy/difference-frequency-gen' },
    title: 'Difference Frequency Generation',
  description: 'Generate tunable mid-IR via DFG: _idler = _pump − _signal. Essential for IR spectroscopy sources.'
};
const jsonLd = generateCalculatorJsonLd(
  `Difference Frequency Generation',
  description: 'Generate tunable mid-IR via DFG: _idler = _pump − _signal. Essential for IR spectroscopy sources.'
};


const jsonLd = generateCalculatorJsonLd(
  'Difference Frequency Generation',
  'Generate tunable mid-IR via DFG: _idler = _pump − _signal. Essential for IR spectroscopy sources.',
  'https://photonics-calculators.vercel.app/spectroscopy/difference-frequency-gen',
  { category: 'Spectroscopy`,
  `Generate tunable mid-IR via DFG: _idler = _pump − _signal. Essential for IR spectroscopy sources.'
};


const jsonLd = generateCalculatorJsonLd(
  'Difference Frequency Generation',
  'Generate tunable mid-IR via DFG: _idler = _pump − _signal. Essential for IR spectroscopy sources.',
  'https://photonics-calculators.vercel.app/spectroscopy/difference-frequency-gen',
  { category: 'Spectroscopy`,
  `https://photonics-calculators.vercel.app/spectroscopy/difference-frequency-gen`,
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

import type { Metadata } from "next";
import { generateCalculatorJsonLd, JsonLdScript } from '../../../lib/json-ld';
import PageClient from "./page-client";

export const metadata: Metadata = {
    alternates: { canonical: 'https://photonics-calculators.vercel.app/laser-safety/peak-power' },
    title: 'Peak Power Calculator',
  description: 'Convert average power to peak power for pulsed lasers. Essential for assessing single-pulse hazards.'
};
const jsonLd = generateCalculatorJsonLd(
  `Peak Power Calculator',
  description: 'Convert average power to peak power for pulsed lasers. Essential for assessing single-pulse hazards.'
};


const jsonLd = generateCalculatorJsonLd(
  'Peak Power Calculator',
  'Convert average power to peak power for pulsed lasers. Essential for assessing single-pulse hazards.',
  'https://photonics-calculators.vercel.app/laser-safety/peak-power',
  { category: 'Laser Safety`,
  `Convert average power to peak power for pulsed lasers. Essential for assessing single-pulse hazards.'
};


const jsonLd = generateCalculatorJsonLd(
  'Peak Power Calculator',
  'Convert average power to peak power for pulsed lasers. Essential for assessing single-pulse hazards.',
  'https://photonics-calculators.vercel.app/laser-safety/peak-power',
  { category: 'Laser Safety`,
  `https://photonics-calculators.vercel.app/laser-safety/peak-power`,
  { category: `Laser Safety` }
);
export default function Page() {
  return (
    <>
      <JsonLdScript data={jsonLd} />
      <PageClient />
    </>
  );
}

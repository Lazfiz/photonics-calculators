import type { Metadata } from "next";
import { generateCalculatorJsonLd, JsonLdScript } from '../../../lib/json-ld';
import PageClient from "./page-client";

export const metadata: Metadata = {
    alternates: { canonical: 'https://photonics-calculators.vercel.app/laser-safety/classification' },
    title: 'Laser Classification — IEC 60825-1:2014',
  description: 'Laser product classification per IEC 60825-1 Edition 3.0 (2014). CW and pulsed AEL thresholds with C_A and C_B correction factors.'
};
const jsonLd = generateCalculatorJsonLd(
  `Laser Classification — IEC 60825-1:2014',
  description: 'Laser product classification per IEC 60825-1 Edition 3.0 (2014). CW and pulsed AEL thresholds with C_A and C_B correction factors.'
};


const jsonLd = generateCalculatorJsonLd(
  'Laser Classification — IEC 60825-1:2014',
  'Laser product classification per IEC 60825-1 Edition 3.0 (2014). CW and pulsed AEL thresholds with C_A and C_B correction factors.',
  'https://photonics-calculators.vercel.app/laser-safety/classification',
  { category: 'Laser Safety`,
  `Laser product classification per IEC 60825-1 Edition 3.0 (2014). CW and pulsed AEL thresholds with C_A and C_B correction factors.'
};


const jsonLd = generateCalculatorJsonLd(
  'Laser Classification — IEC 60825-1:2014',
  'Laser product classification per IEC 60825-1 Edition 3.0 (2014). CW and pulsed AEL thresholds with C_A and C_B correction factors.',
  'https://photonics-calculators.vercel.app/laser-safety/classification',
  { category: 'Laser Safety`,
  `https://photonics-calculators.vercel.app/laser-safety/classification`,
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

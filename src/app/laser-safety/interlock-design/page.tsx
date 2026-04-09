import type { Metadata } from "next";
import { generateCalculatorJsonLd, JsonLdScript } from '../../../lib/json-ld';
import PageClient from "./page-client";

export const metadata: Metadata = {
    alternates: { canonical: 'https://photonics-calculators.vercel.app/laser-safety/interlock-design' },
    title: 'Interlock Time Calculation',
  description: 'Calculates required interlock/shutter response time based on laser hazard level. IEC 60825-1 and ANSI Z136.1 require interlocks to terminate emission before exposure exceeds MPE.'
};
const jsonLd = generateCalculatorJsonLd(
  `Interlock Time Calculation',
  description: 'Calculates required interlock/shutter response time based on laser hazard level. IEC 60825-1 and ANSI Z136.1 require interlocks to terminate emission before exposure exceeds MPE.'
};


const jsonLd = generateCalculatorJsonLd(
  'Interlock Time Calculation',
  'Calculates required interlock/shutter response time based on laser hazard level. IEC 60825-1 and ANSI Z136.1 require interlocks to terminate emission before exposure exceeds MPE.',
  'https://photonics-calculators.vercel.app/laser-safety/interlock-design',
  { category: 'Laser Safety`,
  `Calculates required interlock/shutter response time based on laser hazard level. IEC 60825-1 and ANSI Z136.1 require interlocks to terminate emission before exposure exceeds MPE.'
};


const jsonLd = generateCalculatorJsonLd(
  'Interlock Time Calculation',
  'Calculates required interlock/shutter response time based on laser hazard level. IEC 60825-1 and ANSI Z136.1 require interlocks to terminate emission before exposure exceeds MPE.',
  'https://photonics-calculators.vercel.app/laser-safety/interlock-design',
  { category: 'Laser Safety`,
  `https://photonics-calculators.vercel.app/laser-safety/interlock-design`,
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

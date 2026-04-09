import type { Metadata } from "next";
import { generateCalculatorJsonLd, JsonLdScript } from '../../../lib/json-ld';
import PageClient from "./page-client";

export const metadata: Metadata = {
    alternates: { canonical: 'https://photonics-calculators.vercel.app/laser-safety/aversion-response' },
    title: 'Aversion Response Time',
  description: 'Calculates MPE at the natural aversion/blink response time (0.25 s) and Class 2 limits per ANSI Z136.1 / IEC 60825-1.'
};
const jsonLd = generateCalculatorJsonLd(
  `Aversion Response Time',
  description: 'Calculates MPE at the natural aversion/blink response time (0.25 s) and Class 2 limits per ANSI Z136.1 / IEC 60825-1.'
};


const jsonLd = generateCalculatorJsonLd(
  'Aversion Response Time',
  'Calculates MPE at the natural aversion/blink response time (0.25 s) and Class 2 limits per ANSI Z136.1 / IEC 60825-1.',
  'https://photonics-calculators.vercel.app/laser-safety/aversion-response',
  { category: 'Laser Safety`,
  `Calculates MPE at the natural aversion/blink response time (0.25 s) and Class 2 limits per ANSI Z136.1 / IEC 60825-1.'
};


const jsonLd = generateCalculatorJsonLd(
  'Aversion Response Time',
  'Calculates MPE at the natural aversion/blink response time (0.25 s) and Class 2 limits per ANSI Z136.1 / IEC 60825-1.',
  'https://photonics-calculators.vercel.app/laser-safety/aversion-response',
  { category: 'Laser Safety`,
  `https://photonics-calculators.vercel.app/laser-safety/aversion-response`,
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

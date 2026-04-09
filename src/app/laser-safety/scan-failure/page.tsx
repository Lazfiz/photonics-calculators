import type { Metadata } from "next";
import { generateCalculatorJsonLd, JsonLdScript } from '../../../lib/json-ld';
import PageClient from "./page-client";

export const metadata: Metadata = {
    alternates: { canonical: 'https://photonics-calculators.vercel.app/laser-safety/scan-failure' },
    title: 'Scan Failure Analysis',
  description: 'Analyzes hazard when a scanning laser fails to scan, causing the beam to dwell on a single point. IEC 60825-1 scan failure assessment.'
};
const jsonLd = generateCalculatorJsonLd(
  `Scan Failure Analysis',
  description: 'Analyzes hazard when a scanning laser fails to scan, causing the beam to dwell on a single point. IEC 60825-1 scan failure assessment.'
};


const jsonLd = generateCalculatorJsonLd(
  'Scan Failure Analysis',
  'Analyzes hazard when a scanning laser fails to scan, causing the beam to dwell on a single point. IEC 60825-1 scan failure assessment.',
  'https://photonics-calculators.vercel.app/laser-safety/scan-failure',
  { category: 'Laser Safety`,
  `Analyzes hazard when a scanning laser fails to scan, causing the beam to dwell on a single point. IEC 60825-1 scan failure assessment.'
};


const jsonLd = generateCalculatorJsonLd(
  'Scan Failure Analysis',
  'Analyzes hazard when a scanning laser fails to scan, causing the beam to dwell on a single point. IEC 60825-1 scan failure assessment.',
  'https://photonics-calculators.vercel.app/laser-safety/scan-failure',
  { category: 'Laser Safety`,
  `https://photonics-calculators.vercel.app/laser-safety/scan-failure`,
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

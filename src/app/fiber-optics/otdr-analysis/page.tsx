import type { Metadata } from "next";
import { generateCalculatorJsonLd, JsonLdScript } from '../../../lib/json-ld';
import PageClient from "./page-client";

export const metadata: Metadata = {
    alternates: { canonical: 'https://photonics-calculators.vercel.app/fiber-optics/otdr-analysis' },
    title: 'OTDR Analysis',
  description: 'Simulate OTDR traces, calculate spatial resolution, dynamic range, dead zones, and event analysis for fiber characterization.'
};
const jsonLd = generateCalculatorJsonLd(
  `OTDR Analysis',
  description: 'Simulate OTDR traces, calculate spatial resolution, dynamic range, dead zones, and event analysis for fiber characterization.'
};


const jsonLd = generateCalculatorJsonLd(
  'OTDR Analysis',
  'Simulate OTDR traces, calculate spatial resolution, dynamic range, dead zones, and event analysis for fiber characterization.',
  'https://photonics-calculators.vercel.app/fiber-optics/otdr-analysis',
  { category: 'Fiber Optics`,
  `Simulate OTDR traces, calculate spatial resolution, dynamic range, dead zones, and event analysis for fiber characterization.'
};


const jsonLd = generateCalculatorJsonLd(
  'OTDR Analysis',
  'Simulate OTDR traces, calculate spatial resolution, dynamic range, dead zones, and event analysis for fiber characterization.',
  'https://photonics-calculators.vercel.app/fiber-optics/otdr-analysis',
  { category: 'Fiber Optics`,
  `https://photonics-calculators.vercel.app/fiber-optics/otdr-analysis`,
  { category: `Fiber Optics` }
);
export default function Page() {
  return (
    <>
      <JsonLdScript data={jsonLd} />
      <PageClient />
    </>
  );
}

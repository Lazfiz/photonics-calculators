import type { Metadata } from "next";
import { generateCalculatorJsonLd, JsonLdScript } from '../../../lib/json-ld';
import PageClient from "./page-client";

export const metadata: Metadata = {
    alternates: { canonical: 'https://photonics-calculators.vercel.app/laser-safety/ael-limits' },
    title: 'Accessible Emission Limits (AEL)',
  description: 'IEC 60825-1 laser classification AEL thresholds. Simplified model for educational reference.'
};
const jsonLd = generateCalculatorJsonLd(
  `Accessible Emission Limits (AEL)',
  description: 'IEC 60825-1 laser classification AEL thresholds. Simplified model for educational reference.'
};


const jsonLd = generateCalculatorJsonLd(
  'Accessible Emission Limits (AEL)',
  'IEC 60825-1 laser classification AEL thresholds. Simplified model for educational reference.',
  'https://photonics-calculators.vercel.app/laser-safety/ael-limits',
  { category: 'Laser Safety`,
  `IEC 60825-1 laser classification AEL thresholds. Simplified model for educational reference.'
};


const jsonLd = generateCalculatorJsonLd(
  'Accessible Emission Limits (AEL)',
  'IEC 60825-1 laser classification AEL thresholds. Simplified model for educational reference.',
  'https://photonics-calculators.vercel.app/laser-safety/ael-limits',
  { category: 'Laser Safety`,
  `https://photonics-calculators.vercel.app/laser-safety/ael-limits`,
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

import type { Metadata } from "next";
import { generateCalculatorJsonLd, JsonLdScript } from '../../../lib/json-ld';
import PageClient from "./page-client";

export const metadata: Metadata = {
    alternates: { canonical: 'https://photonics-calculators.vercel.app/free-space-comms/pointing-loss' },
    title: 'Pointing Loss',
  description: 'Interactive free-space optical pointing-loss calculator with jitter, misalignment, and aperture coupling.'
};
const jsonLd = generateCalculatorJsonLd(
  `Pointing Loss',
  description: 'Interactive free-space optical pointing-loss calculator with jitter, misalignment, and aperture coupling.'
};


const jsonLd = generateCalculatorJsonLd(
  'Pointing Loss',
  'Interactive free-space optical pointing-loss calculator with jitter, misalignment, and aperture coupling.',
  'https://photonics-calculators.vercel.app/free-space-comms/pointing-loss',
  { category: 'Free Space Comms`,
  `Interactive free-space optical pointing-loss calculator with jitter, misalignment, and aperture coupling.'
};


const jsonLd = generateCalculatorJsonLd(
  'Pointing Loss',
  'Interactive free-space optical pointing-loss calculator with jitter, misalignment, and aperture coupling.',
  'https://photonics-calculators.vercel.app/free-space-comms/pointing-loss',
  { category: 'Free Space Comms`,
  `https://photonics-calculators.vercel.app/free-space-comms/pointing-loss`,
  { category: `Free Space Comms` }
);
export default function Page() {
  return (
    <>
      <JsonLdScript data={jsonLd} />
      <PageClient />
    </>
  );
}

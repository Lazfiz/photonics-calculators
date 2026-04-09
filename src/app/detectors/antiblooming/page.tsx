import type { Metadata } from "next";
import { generateCalculatorJsonLd, JsonLdScript } from '../../../lib/json-ld';
import PageClient from "./page-client";

export const metadata: Metadata = {
    alternates: { canonical: 'https://photonics-calculators.vercel.app/detectors/antiblooming' },
    title: 'Anti-Blooming Design',
  description: 'Anti-blooming shunts excess charge to drain when well exceeds threshold. Trade-off: charge dump efficiency vs full well capacity and linearity.'
};
const jsonLd = generateCalculatorJsonLd(
  `Anti-Blooming Design',
  description: 'Anti-blooming shunts excess charge to drain when well exceeds threshold. Trade-off: charge dump efficiency vs full well capacity and linearity.'
};


const jsonLd = generateCalculatorJsonLd(
  'Anti-Blooming Design',
  'Anti-blooming shunts excess charge to drain when well exceeds threshold. Trade-off: charge dump efficiency vs full well capacity and linearity.',
  'https://photonics-calculators.vercel.app/detectors/antiblooming',
  { category: 'Detectors`,
  `Anti-blooming shunts excess charge to drain when well exceeds threshold. Trade-off: charge dump efficiency vs full well capacity and linearity.'
};


const jsonLd = generateCalculatorJsonLd(
  'Anti-Blooming Design',
  'Anti-blooming shunts excess charge to drain when well exceeds threshold. Trade-off: charge dump efficiency vs full well capacity and linearity.',
  'https://photonics-calculators.vercel.app/detectors/antiblooming',
  { category: 'Detectors`,
  `https://photonics-calculators.vercel.app/detectors/antiblooming`,
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

import type { Metadata } from "next";
import { generateCalculatorJsonLd, JsonLdScript } from '../../../lib/json-ld';
import PageClient from "./page-client";

export const metadata: Metadata = {
    alternates: { canonical: 'https://photonics-calculators.vercel.app/imaging/super-resolution' },
    title: 'Super-Resolution Calculator',
  description: 'STED and PALM/STORM resolution limits beyond the diffraction barrier.'
};
const jsonLd = generateCalculatorJsonLd(
  `Super-Resolution Calculator',
  description: 'STED and PALM/STORM resolution limits beyond the diffraction barrier.'
};


const jsonLd = generateCalculatorJsonLd(
  'Super-Resolution Calculator',
  'STED and PALM/STORM resolution limits beyond the diffraction barrier.',
  'https://photonics-calculators.vercel.app/imaging/super-resolution',
  { category: 'Imaging`,
  `STED and PALM/STORM resolution limits beyond the diffraction barrier.'
};


const jsonLd = generateCalculatorJsonLd(
  'Super-Resolution Calculator',
  'STED and PALM/STORM resolution limits beyond the diffraction barrier.',
  'https://photonics-calculators.vercel.app/imaging/super-resolution',
  { category: 'Imaging`,
  `https://photonics-calculators.vercel.app/imaging/super-resolution`,
  { category: `Imaging` }
);
export default function Page() {
  return (
    <>
      <JsonLdScript data={jsonLd} />
      <PageClient />
    </>
  );
}

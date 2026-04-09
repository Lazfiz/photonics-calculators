import type { Metadata } from "next";
import { generateCalculatorJsonLd, JsonLdScript } from '../../../lib/json-ld';
import PageClient from "./page-client";

export const metadata: Metadata = {
    alternates: { canonical: 'https://photonics-calculators.vercel.app/imaging/palm-storm' },
    title: 'PALM/STORM Localization Calculator',
  description: 'Estimate effective resolution for single-molecule localization microscopy (PALM/STORM) based on localization precision and labeling density.'
};
const jsonLd = generateCalculatorJsonLd(
  `PALM/STORM Localization Calculator',
  description: 'Estimate effective resolution for single-molecule localization microscopy (PALM/STORM) based on localization precision and labeling density.'
};


const jsonLd = generateCalculatorJsonLd(
  'PALM/STORM Localization Calculator',
  'Estimate effective resolution for single-molecule localization microscopy (PALM/STORM) based on localization precision and labeling density.',
  'https://photonics-calculators.vercel.app/imaging/palm-storm',
  { category: 'Imaging`,
  `Estimate effective resolution for single-molecule localization microscopy (PALM/STORM) based on localization precision and labeling density.'
};


const jsonLd = generateCalculatorJsonLd(
  'PALM/STORM Localization Calculator',
  'Estimate effective resolution for single-molecule localization microscopy (PALM/STORM) based on localization precision and labeling density.',
  'https://photonics-calculators.vercel.app/imaging/palm-storm',
  { category: 'Imaging`,
  `https://photonics-calculators.vercel.app/imaging/palm-storm`,
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

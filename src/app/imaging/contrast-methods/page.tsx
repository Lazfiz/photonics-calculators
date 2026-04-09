import type { Metadata } from "next";
import { generateCalculatorJsonLd, JsonLdScript } from '../../../lib/json-ld';
import PageClient from "./page-client";

export const metadata: Metadata = {
    alternates: { canonical: 'https://photonics-calculators.vercel.app/imaging/contrast-methods' },
    title: 'Phase Contrast & DIC Calculator',
  description: 'Contrast calculations for phase contrast and differential interference contrast microscopy.'
};
const jsonLd = generateCalculatorJsonLd(
  `Phase Contrast & DIC Calculator',
  description: 'Contrast calculations for phase contrast and differential interference contrast microscopy.'
};


const jsonLd = generateCalculatorJsonLd(
  'Phase Contrast & DIC Calculator',
  'Contrast calculations for phase contrast and differential interference contrast microscopy.',
  'https://photonics-calculators.vercel.app/imaging/contrast-methods',
  { category: 'Imaging`,
  `Contrast calculations for phase contrast and differential interference contrast microscopy.'
};


const jsonLd = generateCalculatorJsonLd(
  'Phase Contrast & DIC Calculator',
  'Contrast calculations for phase contrast and differential interference contrast microscopy.',
  'https://photonics-calculators.vercel.app/imaging/contrast-methods',
  { category: 'Imaging`,
  `https://photonics-calculators.vercel.app/imaging/contrast-methods`,
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

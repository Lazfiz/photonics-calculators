import type { Metadata } from "next";
import { generateCalculatorJsonLd, JsonLdScript } from '../../../lib/json-ld';
import PageClient from "./page-client";

export const metadata: Metadata = {
    alternates: { canonical: 'https://photonics-calculators.vercel.app/materials/abbe-number' },
    title: 'Abbe Number (Vd)',
  description: 'Calculate Abbe number from Sellmeier coefficients. Vd = (nD - 1)/(nF - nC).',
};
const jsonLd = generateCalculatorJsonLd(
  `Abbe Number (Vd)',
  description: 'Calculate Abbe number from Sellmeier coefficients. Vd = (nD - 1)/(nF - nC).',
};


const jsonLd = generateCalculatorJsonLd(
  'Abbe Number (Vd)',
  'Calculate Abbe number from Sellmeier coefficients. Vd = (nD - 1)/(nF - nC).',
  'https://photonics-calculators.vercel.app/materials/abbe-number',
  { category: 'Materials`,
  `Calculate Abbe number from Sellmeier coefficients. Vd = (nD - 1)/(nF - nC).',
};


const jsonLd = generateCalculatorJsonLd(
  'Abbe Number (Vd)',
  'Calculate Abbe number from Sellmeier coefficients. Vd = (nD - 1)/(nF - nC).',
  'https://photonics-calculators.vercel.app/materials/abbe-number',
  { category: 'Materials`,
  `https://photonics-calculators.vercel.app/materials/abbe-number`,
  { category: `Materials` }
);
export default function Page() {
  return (
    <>
      <JsonLdScript data={jsonLd} />
      <PageClient />
    </>
  );
}

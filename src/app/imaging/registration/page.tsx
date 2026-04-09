import type { Metadata } from "next";
import { generateCalculatorJsonLd, JsonLdScript } from '../../../lib/json-ld';
import PageClient from "./page-client";

export const metadata: Metadata = {
    alternates: { canonical: 'https://photonics-calculators.vercel.app/imaging/registration' },
    title: 'Image Registration',
  description: 'Calculate transformation parameters, registration accuracy, and evaluate different registration approaches.'
};
const jsonLd = generateCalculatorJsonLd(
  `Image Registration',
  description: 'Calculate transformation parameters, registration accuracy, and evaluate different registration approaches.'
};


const jsonLd = generateCalculatorJsonLd(
  'Image Registration',
  'Calculate transformation parameters, registration accuracy, and evaluate different registration approaches.',
  'https://photonics-calculators.vercel.app/imaging/registration',
  { category: 'Imaging`,
  `Calculate transformation parameters, registration accuracy, and evaluate different registration approaches.'
};


const jsonLd = generateCalculatorJsonLd(
  'Image Registration',
  'Calculate transformation parameters, registration accuracy, and evaluate different registration approaches.',
  'https://photonics-calculators.vercel.app/imaging/registration',
  { category: 'Imaging`,
  `https://photonics-calculators.vercel.app/imaging/registration`,
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

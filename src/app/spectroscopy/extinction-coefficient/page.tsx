import type { Metadata } from "next";
import { generateCalculatorJsonLd, JsonLdScript } from '../../../lib/json-ld';
import PageClient from "./page-client";

export const metadata: Metadata = {
    alternates: { canonical: 'https://photonics-calculators.vercel.app/spectroscopy/extinction-coefficient' },
      title: 'Extinction Coefficient',
  description: 'Calculate molar and specific extinction coefficients from absorbance measurements. Beer-Lambert law: = A / (cl).',
};
const jsonLd = generateCalculatorJsonLd(
  `Extinction Coefficient',
  description: 'Calculate molar and specific extinction coefficients from absorbance measurements. Beer-Lambert law: = A / (cl).',
};


const jsonLd = generateCalculatorJsonLd(
  'Extinction Coefficient',
  'Calculate molar and specific extinction coefficients from absorbance measurements. Beer-Lambert law: = A / (cl).',
  'https://photonics-calculators.vercel.app/spectroscopy/extinction-coefficient',
  { category: 'Spectroscopy`,
  `Calculate molar and specific extinction coefficients from absorbance measurements. Beer-Lambert law: = A / (cl).',
};


const jsonLd = generateCalculatorJsonLd(
  'Extinction Coefficient',
  'Calculate molar and specific extinction coefficients from absorbance measurements. Beer-Lambert law: = A / (cl).',
  'https://photonics-calculators.vercel.app/spectroscopy/extinction-coefficient',
  { category: 'Spectroscopy`,
  `https://photonics-calculators.vercel.app/spectroscopy/extinction-coefficient`,
  { category: `Spectroscopy` }
);
export default function Page() {
  return (
    <>
      <JsonLdScript data={jsonLd} />
      <PageClient />
    </>
  );
}

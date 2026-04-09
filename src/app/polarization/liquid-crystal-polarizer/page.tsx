import type { Metadata } from "next";
import { generateCalculatorJsonLd, JsonLdScript } from '../../../lib/json-ld';
import PageClient from "./page-client";

export const metadata: Metadata = {
    alternates: { canonical: 'https://photonics-calculators.vercel.app/polarization/liquid-crystal-polarizer' },
    title: 'Liquid Crystal Polarizer',
  description: 'Model transmission through twisted nematic (TN), super-twisted nematic (STN), vertically aligned (VA), and electrically controlled birefringence (ECB) LC cells.'
};
const jsonLd = generateCalculatorJsonLd(
  `Liquid Crystal Polarizer',
  description: 'Model transmission through twisted nematic (TN), super-twisted nematic (STN), vertically aligned (VA), and electrically controlled birefringence (ECB) LC cells.'
};


const jsonLd = generateCalculatorJsonLd(
  'Liquid Crystal Polarizer',
  'Model transmission through twisted nematic (TN), super-twisted nematic (STN), vertically aligned (VA), and electrically controlled birefringence (ECB) LC cells.',
  'https://photonics-calculators.vercel.app/polarization/liquid-crystal-polarizer',
  { category: 'Polarization`,
  `Model transmission through twisted nematic (TN), super-twisted nematic (STN), vertically aligned (VA), and electrically controlled birefringence (ECB) LC cells.'
};


const jsonLd = generateCalculatorJsonLd(
  'Liquid Crystal Polarizer',
  'Model transmission through twisted nematic (TN), super-twisted nematic (STN), vertically aligned (VA), and electrically controlled birefringence (ECB) LC cells.',
  'https://photonics-calculators.vercel.app/polarization/liquid-crystal-polarizer',
  { category: 'Polarization`,
  `https://photonics-calculators.vercel.app/polarization/liquid-crystal-polarizer`,
  { category: `Polarization` }
);
export default function Page() {
  return (
    <>
      <JsonLdScript data={jsonLd} />
      <PageClient />
    </>
  );
}

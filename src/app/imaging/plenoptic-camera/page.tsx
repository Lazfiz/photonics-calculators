import type { Metadata } from "next";
import { generateCalculatorJsonLd, JsonLdScript } from '../../../lib/json-ld';
import PageClient from "./page-client";

export const metadata: Metadata = {
    alternates: { canonical: 'https://photonics-calculators.vercel.app/imaging/plenoptic-camera' },
    title: 'Plenoptic Camera Design',
  description: 'Light field camera parameters: spatial-angular tradeoff, refocusing range, and data budgets.'
};
const jsonLd = generateCalculatorJsonLd(
  `Plenoptic Camera Design',
  description: 'Light field camera parameters: spatial-angular tradeoff, refocusing range, and data budgets.'
};


const jsonLd = generateCalculatorJsonLd(
  'Plenoptic Camera Design',
  'Light field camera parameters: spatial-angular tradeoff, refocusing range, and data budgets.',
  'https://photonics-calculators.vercel.app/imaging/plenoptic-camera',
  { category: 'Imaging`,
  `Light field camera parameters: spatial-angular tradeoff, refocusing range, and data budgets.'
};


const jsonLd = generateCalculatorJsonLd(
  'Plenoptic Camera Design',
  'Light field camera parameters: spatial-angular tradeoff, refocusing range, and data budgets.',
  'https://photonics-calculators.vercel.app/imaging/plenoptic-camera',
  { category: 'Imaging`,
  `https://photonics-calculators.vercel.app/imaging/plenoptic-camera`,
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

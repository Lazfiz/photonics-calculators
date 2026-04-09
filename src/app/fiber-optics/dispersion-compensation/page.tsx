import type { Metadata } from "next";
import { generateCalculatorJsonLd, JsonLdScript } from '../../../lib/json-ld';
import PageClient from "./page-client";

export const metadata: Metadata = {
    alternates: { canonical: 'https://photonics-calculators.vercel.app/fiber-optics/dispersion-compensation' },
    title: 'Dispersion Compensation',
  description: 'GVD and TOD compensation analysis for fiber optic links.'
};
const jsonLd = generateCalculatorJsonLd(
  `Dispersion Compensation',
  description: 'GVD and TOD compensation analysis for fiber optic links.'
};


const jsonLd = generateCalculatorJsonLd(
  'Dispersion Compensation',
  'GVD and TOD compensation analysis for fiber optic links.',
  'https://photonics-calculators.vercel.app/fiber-optics/dispersion-compensation',
  { category: 'Fiber Optics`,
  `GVD and TOD compensation analysis for fiber optic links.'
};


const jsonLd = generateCalculatorJsonLd(
  'Dispersion Compensation',
  'GVD and TOD compensation analysis for fiber optic links.',
  'https://photonics-calculators.vercel.app/fiber-optics/dispersion-compensation',
  { category: 'Fiber Optics`,
  `https://photonics-calculators.vercel.app/fiber-optics/dispersion-compensation`,
  { category: `Fiber Optics` }
);
export default function Page() {
  return (
    <>
      <JsonLdScript data={jsonLd} />
      <PageClient />
    </>
  );
}

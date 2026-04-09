import type { Metadata } from "next";
import { generateCalculatorJsonLd, JsonLdScript } from '../../../lib/json-ld';
import PageClient from "./page-client";

export const metadata: Metadata = {
    alternates: { canonical: 'https://photonics-calculators.vercel.app/fiber-optics/micro-bend' },
    title: 'Micro Bend Loss',
  description: 'Calculate microbending loss from periodic perturbations in fiber geometry.'
};
const jsonLd = generateCalculatorJsonLd(
  `Micro Bend Loss',
  description: 'Calculate microbending loss from periodic perturbations in fiber geometry.'
};


const jsonLd = generateCalculatorJsonLd(
  'Micro Bend Loss',
  'Calculate microbending loss from periodic perturbations in fiber geometry.',
  'https://photonics-calculators.vercel.app/fiber-optics/micro-bend',
  { category: 'Fiber Optics`,
  `Calculate microbending loss from periodic perturbations in fiber geometry.'
};


const jsonLd = generateCalculatorJsonLd(
  'Micro Bend Loss',
  'Calculate microbending loss from periodic perturbations in fiber geometry.',
  'https://photonics-calculators.vercel.app/fiber-optics/micro-bend',
  { category: 'Fiber Optics`,
  `https://photonics-calculators.vercel.app/fiber-optics/micro-bend`,
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

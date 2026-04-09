import type { Metadata } from "next";
import { generateCalculatorJsonLd, JsonLdScript } from '../../../lib/json-ld';
import PageClient from "./page-client";

export const metadata: Metadata = {
    alternates: { canonical: 'https://photonics-calculators.vercel.app/fiber-optics/micro-bending-loss' },
    title: 'Microbending Loss',
  description: 'Calculate microbending-induced loss from random perturbations, coating properties, and fiber parameters.'
};
const jsonLd = generateCalculatorJsonLd(
  `Microbending Loss',
  description: 'Calculate microbending-induced loss from random perturbations, coating properties, and fiber parameters.'
};


const jsonLd = generateCalculatorJsonLd(
  'Microbending Loss',
  'Calculate microbending-induced loss from random perturbations, coating properties, and fiber parameters.',
  'https://photonics-calculators.vercel.app/fiber-optics/micro-bending-loss',
  { category: 'Fiber Optics`,
  `Calculate microbending-induced loss from random perturbations, coating properties, and fiber parameters.'
};


const jsonLd = generateCalculatorJsonLd(
  'Microbending Loss',
  'Calculate microbending-induced loss from random perturbations, coating properties, and fiber parameters.',
  'https://photonics-calculators.vercel.app/fiber-optics/micro-bending-loss',
  { category: 'Fiber Optics`,
  `https://photonics-calculators.vercel.app/fiber-optics/micro-bending-loss`,
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

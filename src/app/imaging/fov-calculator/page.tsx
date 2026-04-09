import type { Metadata } from "next";
import { generateCalculatorJsonLd, JsonLdScript } from '../../../lib/json-ld';
import PageClient from "./page-client";

export const metadata: Metadata = {
    alternates: { canonical: 'https://photonics-calculators.vercel.app/imaging/fov-calculator' },
    title: 'Field of View Calculator',
  description: 'Calculate sample FOV from sensor dimensions and system magnification.'
};
const jsonLd = generateCalculatorJsonLd(
  `Field of View Calculator',
  description: 'Calculate sample FOV from sensor dimensions and system magnification.'
};


const jsonLd = generateCalculatorJsonLd(
  'Field of View Calculator',
  'Calculate sample FOV from sensor dimensions and system magnification.',
  'https://photonics-calculators.vercel.app/imaging/fov-calculator',
  { category: 'Imaging`,
  `Calculate sample FOV from sensor dimensions and system magnification.'
};


const jsonLd = generateCalculatorJsonLd(
  'Field of View Calculator',
  'Calculate sample FOV from sensor dimensions and system magnification.',
  'https://photonics-calculators.vercel.app/imaging/fov-calculator',
  { category: 'Imaging`,
  `https://photonics-calculators.vercel.app/imaging/fov-calculator`,
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

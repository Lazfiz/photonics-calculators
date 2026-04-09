import type { Metadata } from "next";
import { generateCalculatorJsonLd, JsonLdScript } from '../../../lib/json-ld';
import PageClient from "./page-client";

export const metadata: Metadata = {
    alternates: { canonical: 'https://photonics-calculators.vercel.app/fiber-optics/multi-core' },
    title: 'Multi Core',
  description: 'Interactive Multi Core calculator for photonics and optical engineering.'
};
const jsonLd = generateCalculatorJsonLd(
  `Multi Core',
  description: 'Interactive Multi Core calculator for photonics and optical engineering.'
};


const jsonLd = generateCalculatorJsonLd(
  'Multi Core',
  'Interactive Multi Core calculator for photonics and optical engineering.',
  'https://photonics-calculators.vercel.app/fiber-optics/multi-core',
  { category: 'Fiber Optics`,
  `Interactive Multi Core calculator for photonics and optical engineering.'
};


const jsonLd = generateCalculatorJsonLd(
  'Multi Core',
  'Interactive Multi Core calculator for photonics and optical engineering.',
  'https://photonics-calculators.vercel.app/fiber-optics/multi-core',
  { category: 'Fiber Optics`,
  `https://photonics-calculators.vercel.app/fiber-optics/multi-core`,
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

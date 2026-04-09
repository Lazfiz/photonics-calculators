import type { Metadata } from "next";
import { generateCalculatorJsonLd, JsonLdScript } from '../../../lib/json-ld';
import PageClient from "./page-client";

export const metadata: Metadata = {
    alternates: { canonical: 'https://photonics-calculators.vercel.app/imaging/confocal-pin-hole' },
    title: 'Confocal Pinhole Size',
  description: 'Optimal pinhole 1 Airy unit (dAU/M). Trade-off: resolution vs signal.'
};
const jsonLd = generateCalculatorJsonLd(
  `Confocal Pinhole Size',
  description: 'Optimal pinhole 1 Airy unit (dAU/M). Trade-off: resolution vs signal.'
};


const jsonLd = generateCalculatorJsonLd(
  'Confocal Pinhole Size',
  'Optimal pinhole 1 Airy unit (dAU/M). Trade-off: resolution vs signal.',
  'https://photonics-calculators.vercel.app/imaging/confocal-pin-hole',
  { category: 'Imaging`,
  `Optimal pinhole 1 Airy unit (dAU/M). Trade-off: resolution vs signal.'
};


const jsonLd = generateCalculatorJsonLd(
  'Confocal Pinhole Size',
  'Optimal pinhole 1 Airy unit (dAU/M). Trade-off: resolution vs signal.',
  'https://photonics-calculators.vercel.app/imaging/confocal-pin-hole',
  { category: 'Imaging`,
  `https://photonics-calculators.vercel.app/imaging/confocal-pin-hole`,
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

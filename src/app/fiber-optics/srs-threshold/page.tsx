import type { Metadata } from "next";
import { generateCalculatorJsonLd, JsonLdScript } from '../../../lib/json-ld';
import PageClient from "./page-client";

export const metadata: Metadata = {
    alternates: { canonical: 'https://photonics-calculators.vercel.app/fiber-optics/srs-threshold' },
    title: 'SRS Threshold Power',
  description: 'Calculate Stimulated Raman Scattering threshold for optical fibers.'
};
const jsonLd = generateCalculatorJsonLd(
  `SRS Threshold Power',
  description: 'Calculate Stimulated Raman Scattering threshold for optical fibers.'
};


const jsonLd = generateCalculatorJsonLd(
  'SRS Threshold Power',
  'Calculate Stimulated Raman Scattering threshold for optical fibers.',
  'https://photonics-calculators.vercel.app/fiber-optics/srs-threshold',
  { category: 'Fiber Optics`,
  `Calculate Stimulated Raman Scattering threshold for optical fibers.'
};


const jsonLd = generateCalculatorJsonLd(
  'SRS Threshold Power',
  'Calculate Stimulated Raman Scattering threshold for optical fibers.',
  'https://photonics-calculators.vercel.app/fiber-optics/srs-threshold',
  { category: 'Fiber Optics`,
  `https://photonics-calculators.vercel.app/fiber-optics/srs-threshold`,
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

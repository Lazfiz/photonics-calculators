import type { Metadata } from "next";
import { generateCalculatorJsonLd, JsonLdScript } from '../../../lib/json-ld';
import PageClient from "./page-client";

export const metadata: Metadata = {
    alternates: { canonical: 'https://photonics-calculators.vercel.app/fiber-optics/sbs-threshold' },
    title: 'SBS Threshold Power',
  description: 'Calculate Stimulated Brillouin Scattering threshold for optical fibers.'
};
const jsonLd = generateCalculatorJsonLd(
  `SBS Threshold Power',
  description: 'Calculate Stimulated Brillouin Scattering threshold for optical fibers.'
};


const jsonLd = generateCalculatorJsonLd(
  'SBS Threshold Power',
  'Calculate Stimulated Brillouin Scattering threshold for optical fibers.',
  'https://photonics-calculators.vercel.app/fiber-optics/sbs-threshold',
  { category: 'Fiber Optics`,
  `Calculate Stimulated Brillouin Scattering threshold for optical fibers.'
};


const jsonLd = generateCalculatorJsonLd(
  'SBS Threshold Power',
  'Calculate Stimulated Brillouin Scattering threshold for optical fibers.',
  'https://photonics-calculators.vercel.app/fiber-optics/sbs-threshold',
  { category: 'Fiber Optics`,
  `https://photonics-calculators.vercel.app/fiber-optics/sbs-threshold`,
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

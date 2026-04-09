import type { Metadata } from "next";
import { generateCalculatorJsonLd, JsonLdScript } from '../../../lib/json-ld';
import PageClient from "./page-client";

export const metadata: Metadata = {
    alternates: { canonical: 'https://photonics-calculators.vercel.app/imaging/third-harmonic-generation' },
    title: 'Third Harmonic Generation (THG) Calculator',
  description: 'THG imaging parameters for interface and membrane contrast in biological samples.'
};
const jsonLd = generateCalculatorJsonLd(
  `Third Harmonic Generation (THG) Calculator',
  description: 'THG imaging parameters for interface and membrane contrast in biological samples.'
};


const jsonLd = generateCalculatorJsonLd(
  'Third Harmonic Generation (THG) Calculator',
  'THG imaging parameters for interface and membrane contrast in biological samples.',
  'https://photonics-calculators.vercel.app/imaging/third-harmonic-generation',
  { category: 'Imaging`,
  `THG imaging parameters for interface and membrane contrast in biological samples.'
};


const jsonLd = generateCalculatorJsonLd(
  'Third Harmonic Generation (THG) Calculator',
  'THG imaging parameters for interface and membrane contrast in biological samples.',
  'https://photonics-calculators.vercel.app/imaging/third-harmonic-generation',
  { category: 'Imaging`,
  `https://photonics-calculators.vercel.app/imaging/third-harmonic-generation`,
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

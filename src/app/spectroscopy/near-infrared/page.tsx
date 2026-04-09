import type { Metadata } from "next";
import { generateCalculatorJsonLd, JsonLdScript } from '../../../lib/json-ld';
import PageClient from "./page-client";

export const metadata: Metadata = {
    alternates: { canonical: 'https://photonics-calculators.vercel.app/spectroscopy/near-infrared' },
    title: 'Near-Infrared (NIR) Spectroscopy',
  description: 'Overtone and combination band analysis for non-destructive composition measurement.'
};
const jsonLd = generateCalculatorJsonLd(
  `Near-Infrared (NIR) Spectroscopy',
  description: 'Overtone and combination band analysis for non-destructive composition measurement.'
};


const jsonLd = generateCalculatorJsonLd(
  'Near-Infrared (NIR) Spectroscopy',
  'Overtone and combination band analysis for non-destructive composition measurement.',
  'https://photonics-calculators.vercel.app/spectroscopy/near-infrared',
  { category: 'Spectroscopy`,
  `Overtone and combination band analysis for non-destructive composition measurement.'
};


const jsonLd = generateCalculatorJsonLd(
  'Near-Infrared (NIR) Spectroscopy',
  'Overtone and combination band analysis for non-destructive composition measurement.',
  'https://photonics-calculators.vercel.app/spectroscopy/near-infrared',
  { category: 'Spectroscopy`,
  `https://photonics-calculators.vercel.app/spectroscopy/near-infrared`,
  { category: `Spectroscopy` }
);
export default function Page() {
  return (
    <>
      <JsonLdScript data={jsonLd} />
      <PageClient />
    </>
  );
}

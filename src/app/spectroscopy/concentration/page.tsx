import type { Metadata } from "next";
import { generateCalculatorJsonLd, JsonLdScript } from '../../../lib/json-ld';
import PageClient from "./page-client";

export const metadata: Metadata = {
    alternates: { canonical: 'https://photonics-calculators.vercel.app/spectroscopy/concentration' },
      title: 'Concentration from Absorbance',
  description: 'c = A / (l) — determine concentration from measured absorbance using Beer-Lambert law.',
};
const jsonLd = generateCalculatorJsonLd(
  `Concentration from Absorbance',
  description: 'c = A / (l) — determine concentration from measured absorbance using Beer-Lambert law.',
};


const jsonLd = generateCalculatorJsonLd(
  'Concentration from Absorbance',
  'c = A / (l) — determine concentration from measured absorbance using Beer-Lambert law.',
  'https://photonics-calculators.vercel.app/spectroscopy/concentration',
  { category: 'Spectroscopy`,
  `c = A / (l) — determine concentration from measured absorbance using Beer-Lambert law.',
};


const jsonLd = generateCalculatorJsonLd(
  'Concentration from Absorbance',
  'c = A / (l) — determine concentration from measured absorbance using Beer-Lambert law.',
  'https://photonics-calculators.vercel.app/spectroscopy/concentration',
  { category: 'Spectroscopy`,
  `https://photonics-calculators.vercel.app/spectroscopy/concentration`,
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

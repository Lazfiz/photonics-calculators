import type { Metadata } from "next";
import { generateCalculatorJsonLd, JsonLdScript } from '../../../lib/json-ld';
import PageClient from "./page-client";

export const metadata: Metadata = {
    alternates: { canonical: 'https://photonics-calculators.vercel.app/spectroscopy/apodization' },
    title: 'Apodization Functions',
  description: 'Window functions and their instrument line shapes (ILS). Trade-off: resolution vs sidelobe suppression.'
};
const jsonLd = generateCalculatorJsonLd(
  `Apodization Functions',
  description: 'Window functions and their instrument line shapes (ILS). Trade-off: resolution vs sidelobe suppression.'
};


const jsonLd = generateCalculatorJsonLd(
  'Apodization Functions',
  'Window functions and their instrument line shapes (ILS). Trade-off: resolution vs sidelobe suppression.',
  'https://photonics-calculators.vercel.app/spectroscopy/apodization',
  { category: 'Spectroscopy`,
  `Window functions and their instrument line shapes (ILS). Trade-off: resolution vs sidelobe suppression.'
};


const jsonLd = generateCalculatorJsonLd(
  'Apodization Functions',
  'Window functions and their instrument line shapes (ILS). Trade-off: resolution vs sidelobe suppression.',
  'https://photonics-calculators.vercel.app/spectroscopy/apodization',
  { category: 'Spectroscopy`,
  `https://photonics-calculators.vercel.app/spectroscopy/apodization`,
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

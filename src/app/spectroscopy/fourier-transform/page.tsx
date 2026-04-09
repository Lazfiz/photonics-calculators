import type { Metadata } from "next";
import { generateCalculatorJsonLd, JsonLdScript } from '../../../lib/json-ld';
import PageClient from "./page-client";

export const metadata: Metadata = {
    alternates: { canonical: 'https://photonics-calculators.vercel.app/spectroscopy/fourier-transform' },
    title: 'Fourier Transform Basics',
  description: 'Decompose a composite time-domain signal into its frequency components via DFT.'
};
const jsonLd = generateCalculatorJsonLd(
  `Fourier Transform Basics',
  description: 'Decompose a composite time-domain signal into its frequency components via DFT.'
};


const jsonLd = generateCalculatorJsonLd(
  'Fourier Transform Basics',
  'Decompose a composite time-domain signal into its frequency components via DFT.',
  'https://photonics-calculators.vercel.app/spectroscopy/fourier-transform',
  { category: 'Spectroscopy`,
  `Decompose a composite time-domain signal into its frequency components via DFT.'
};


const jsonLd = generateCalculatorJsonLd(
  'Fourier Transform Basics',
  'Decompose a composite time-domain signal into its frequency components via DFT.',
  'https://photonics-calculators.vercel.app/spectroscopy/fourier-transform',
  { category: 'Spectroscopy`,
  `https://photonics-calculators.vercel.app/spectroscopy/fourier-transform`,
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

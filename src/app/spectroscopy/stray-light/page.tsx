import type { Metadata } from "next";
import { generateCalculatorJsonLd, JsonLdScript } from '../../../lib/json-ld';
import PageClient from "./page-client";

export const metadata: Metadata = {
    alternates: { canonical: 'https://photonics-calculators.vercel.app/spectroscopy/stray-light' },
    title: 'Stray Light Rejection',
  description: 'Ghost order analysis and stray light estimation for grating-based spectrometers.'
};
const jsonLd = generateCalculatorJsonLd(
  `Stray Light Rejection',
  description: 'Ghost order analysis and stray light estimation for grating-based spectrometers.'
};


const jsonLd = generateCalculatorJsonLd(
  'Stray Light Rejection',
  'Ghost order analysis and stray light estimation for grating-based spectrometers.',
  'https://photonics-calculators.vercel.app/spectroscopy/stray-light',
  { category: 'Spectroscopy`,
  `Ghost order analysis and stray light estimation for grating-based spectrometers.'
};


const jsonLd = generateCalculatorJsonLd(
  'Stray Light Rejection',
  'Ghost order analysis and stray light estimation for grating-based spectrometers.',
  'https://photonics-calculators.vercel.app/spectroscopy/stray-light',
  { category: 'Spectroscopy`,
  `https://photonics-calculators.vercel.app/spectroscopy/stray-light`,
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

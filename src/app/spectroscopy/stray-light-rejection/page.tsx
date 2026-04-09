import type { Metadata } from "next";
import { generateCalculatorJsonLd, JsonLdScript } from '../../../lib/json-ld';
import PageClient from "./page-client";

export const metadata: Metadata = {
    alternates: { canonical: 'https://photonics-calculators.vercel.app/spectroscopy/stray-light-rejection' },
    title: 'Stray Light Rejection',
  description: 'Impact of stray light on photometric accuracy. Critical for high-absorbance measurements.'
};
const jsonLd = generateCalculatorJsonLd(
  `Stray Light Rejection',
  description: 'Impact of stray light on photometric accuracy. Critical for high-absorbance measurements.'
};


const jsonLd = generateCalculatorJsonLd(
  'Stray Light Rejection',
  'Impact of stray light on photometric accuracy. Critical for high-absorbance measurements.',
  'https://photonics-calculators.vercel.app/spectroscopy/stray-light-rejection',
  { category: 'Spectroscopy`,
  `Impact of stray light on photometric accuracy. Critical for high-absorbance measurements.'
};


const jsonLd = generateCalculatorJsonLd(
  'Stray Light Rejection',
  'Impact of stray light on photometric accuracy. Critical for high-absorbance measurements.',
  'https://photonics-calculators.vercel.app/spectroscopy/stray-light-rejection',
  { category: 'Spectroscopy`,
  `https://photonics-calculators.vercel.app/spectroscopy/stray-light-rejection`,
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

import type { Metadata } from "next";
import { generateCalculatorJsonLd, JsonLdScript } from '../../../lib/json-ld';
import PageClient from "./page-client";

export const metadata: Metadata = {
    alternates: { canonical: 'https://photonics-calculators.vercel.app/imaging/simultaneous-multicolor' },
    title: 'Simultaneous Multicolor Imaging',
  description: 'Calculate spectral separation, crosstalk, timing budgets, and SNR for multi-channel fluorescence imaging.'
};
const jsonLd = generateCalculatorJsonLd(
  `Simultaneous Multicolor Imaging',
  description: 'Calculate spectral separation, crosstalk, timing budgets, and SNR for multi-channel fluorescence imaging.'
};


const jsonLd = generateCalculatorJsonLd(
  'Simultaneous Multicolor Imaging',
  'Calculate spectral separation, crosstalk, timing budgets, and SNR for multi-channel fluorescence imaging.',
  'https://photonics-calculators.vercel.app/imaging/simultaneous-multicolor',
  { category: 'Imaging`,
  `Calculate spectral separation, crosstalk, timing budgets, and SNR for multi-channel fluorescence imaging.'
};


const jsonLd = generateCalculatorJsonLd(
  'Simultaneous Multicolor Imaging',
  'Calculate spectral separation, crosstalk, timing budgets, and SNR for multi-channel fluorescence imaging.',
  'https://photonics-calculators.vercel.app/imaging/simultaneous-multicolor',
  { category: 'Imaging`,
  `https://photonics-calculators.vercel.app/imaging/simultaneous-multicolor`,
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

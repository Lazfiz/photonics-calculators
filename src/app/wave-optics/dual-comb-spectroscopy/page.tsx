import type { Metadata } from "next";
import { generateCalculatorJsonLd, JsonLdScript } from '../../../lib/json-ld';
import PageClient from "./page-client";

export const metadata: Metadata = {
    alternates: { canonical: 'https://photonics-calculators.vercel.app/wave-optics/dual-comb-spectroscopy' },
    title: 'Dual-Comb Spectroscopy',
  description: 'High-resolution spectroscopy using two frequency combs with slightly different repetition rates.'
};
const jsonLd = generateCalculatorJsonLd(
  `Dual-Comb Spectroscopy',
  description: 'High-resolution spectroscopy using two frequency combs with slightly different repetition rates.'
};


const jsonLd = generateCalculatorJsonLd(
  'Dual-Comb Spectroscopy',
  'High-resolution spectroscopy using two frequency combs with slightly different repetition rates.',
  'https://photonics-calculators.vercel.app/wave-optics/dual-comb-spectroscopy',
  { category: 'Wave Optics`,
  `High-resolution spectroscopy using two frequency combs with slightly different repetition rates.'
};


const jsonLd = generateCalculatorJsonLd(
  'Dual-Comb Spectroscopy',
  'High-resolution spectroscopy using two frequency combs with slightly different repetition rates.',
  'https://photonics-calculators.vercel.app/wave-optics/dual-comb-spectroscopy',
  { category: 'Wave Optics`,
  `https://photonics-calculators.vercel.app/wave-optics/dual-comb-spectroscopy`,
  { category: `Wave Optics` }
);
export default function Page() {
  return (
    <>
      <JsonLdScript data={jsonLd} />
      <PageClient />
    </>
  );
}

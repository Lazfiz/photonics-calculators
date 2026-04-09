import type { Metadata } from "next";
import { generateCalculatorJsonLd, JsonLdScript } from '../../../lib/json-ld';
import PageClient from "./page-client";

export const metadata: Metadata = {
    alternates: { canonical: 'https://photonics-calculators.vercel.app/detectors/nep' },
    title: 'Noise Equivalent Power (NEP) & Detectivity (D*)',
  description: 'Calculate NEP and specific detectivity D* from detector noise sources: shot noise, thermal (Johnson) noise, and dark current.'
};
const jsonLd = generateCalculatorJsonLd(
  `Noise Equivalent Power (NEP) & Detectivity (D*)',
  description: 'Calculate NEP and specific detectivity D* from detector noise sources: shot noise, thermal (Johnson) noise, and dark current.'
};


const jsonLd = generateCalculatorJsonLd(
  'Noise Equivalent Power (NEP) & Detectivity (D*)',
  'Calculate NEP and specific detectivity D* from detector noise sources: shot noise, thermal (Johnson) noise, and dark current.',
  'https://photonics-calculators.vercel.app/detectors/nep',
  { category: 'Detectors`,
  `Calculate NEP and specific detectivity D* from detector noise sources: shot noise, thermal (Johnson) noise, and dark current.'
};


const jsonLd = generateCalculatorJsonLd(
  'Noise Equivalent Power (NEP) & Detectivity (D*)',
  'Calculate NEP and specific detectivity D* from detector noise sources: shot noise, thermal (Johnson) noise, and dark current.',
  'https://photonics-calculators.vercel.app/detectors/nep',
  { category: 'Detectors`,
  `https://photonics-calculators.vercel.app/detectors/nep`,
  { category: `Detectors` }
);
export default function Page() {
  return (
    <>
      <JsonLdScript data={jsonLd} />
      <PageClient />
    </>
  );
}

import type { Metadata } from "next";
import { generateCalculatorJsonLd, JsonLdScript } from '../../../lib/json-ld';
import PageClient from "./page-client";

export const metadata: Metadata = {
    alternates: { canonical: 'https://photonics-calculators.vercel.app/imaging/resolution' },
    title: 'Resolution Calculator',
  description: 'Abbe and Rayleigh lateral resolution limits for diffraction-limited imaging.'
};
const jsonLd = generateCalculatorJsonLd(
  `Resolution Calculator',
  description: 'Abbe and Rayleigh lateral resolution limits for diffraction-limited imaging.'
};


const jsonLd = generateCalculatorJsonLd(
  'Resolution Calculator',
  'Abbe and Rayleigh lateral resolution limits for diffraction-limited imaging.',
  'https://photonics-calculators.vercel.app/imaging/resolution',
  { category: 'Imaging`,
  `Abbe and Rayleigh lateral resolution limits for diffraction-limited imaging.'
};


const jsonLd = generateCalculatorJsonLd(
  'Resolution Calculator',
  'Abbe and Rayleigh lateral resolution limits for diffraction-limited imaging.',
  'https://photonics-calculators.vercel.app/imaging/resolution',
  { category: 'Imaging`,
  `https://photonics-calculators.vercel.app/imaging/resolution`,
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

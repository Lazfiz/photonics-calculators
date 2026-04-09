import type { Metadata } from "next";
import { generateCalculatorJsonLd, JsonLdScript } from '../../../lib/json-ld';
import PageClient from "./page-client";

export const metadata: Metadata = {
    alternates: { canonical: 'https://photonics-calculators.vercel.app/imaging/stimulated-raman-microscopy' },
    title: 'Stimulated Raman Scattering Microscopy Calculator',
  description: 'Calculate SRS signal levels, SNR, resolution, and imaging speed for label-free chemical imaging.'
};
const jsonLd = generateCalculatorJsonLd(
  `Stimulated Raman Scattering Microscopy Calculator',
  description: 'Calculate SRS signal levels, SNR, resolution, and imaging speed for label-free chemical imaging.'
};


const jsonLd = generateCalculatorJsonLd(
  'Stimulated Raman Scattering Microscopy Calculator',
  'Calculate SRS signal levels, SNR, resolution, and imaging speed for label-free chemical imaging.',
  'https://photonics-calculators.vercel.app/imaging/stimulated-raman-microscopy',
  { category: 'Imaging`,
  `Calculate SRS signal levels, SNR, resolution, and imaging speed for label-free chemical imaging.'
};


const jsonLd = generateCalculatorJsonLd(
  'Stimulated Raman Scattering Microscopy Calculator',
  'Calculate SRS signal levels, SNR, resolution, and imaging speed for label-free chemical imaging.',
  'https://photonics-calculators.vercel.app/imaging/stimulated-raman-microscopy',
  { category: 'Imaging`,
  `https://photonics-calculators.vercel.app/imaging/stimulated-raman-microscopy`,
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

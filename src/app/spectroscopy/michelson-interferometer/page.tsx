import type { Metadata } from "next";
import { generateCalculatorJsonLd, JsonLdScript } from '../../../lib/json-ld';
import PageClient from "./page-client";

export const metadata: Metadata = {
    alternates: { canonical: 'https://photonics-calculators.vercel.app/spectroscopy/michelson-interferometer' },
    title: 'Michelson Interferometer',
  description: 'Interferogram spectrum via Fourier transform. Core of FTIR spectroscopy.'
};
const jsonLd = generateCalculatorJsonLd(
  `Michelson Interferometer',
  description: 'Interferogram spectrum via Fourier transform. Core of FTIR spectroscopy.'
};


const jsonLd = generateCalculatorJsonLd(
  'Michelson Interferometer',
  'Interferogram spectrum via Fourier transform. Core of FTIR spectroscopy.',
  'https://photonics-calculators.vercel.app/spectroscopy/michelson-interferometer',
  { category: 'Spectroscopy`,
  `Interferogram spectrum via Fourier transform. Core of FTIR spectroscopy.'
};


const jsonLd = generateCalculatorJsonLd(
  'Michelson Interferometer',
  'Interferogram spectrum via Fourier transform. Core of FTIR spectroscopy.',
  'https://photonics-calculators.vercel.app/spectroscopy/michelson-interferometer',
  { category: 'Spectroscopy`,
  `https://photonics-calculators.vercel.app/spectroscopy/michelson-interferometer`,
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

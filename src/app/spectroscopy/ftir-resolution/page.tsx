import type { Metadata } from "next";
import { generateCalculatorJsonLd, JsonLdScript } from '../../../lib/json-ld';
import PageClient from "./page-client";

export const metadata: Metadata = {
    alternates: { canonical: 'https://photonics-calculators.vercel.app/spectroscopy/ftir-resolution' },
    title: 'FTIR Resolution Calculator',
  description: 'FTIR spectral resolution from maximum OPD, apodization, and scan parameters.'
};
const jsonLd = generateCalculatorJsonLd(
  `FTIR Resolution Calculator',
  description: 'FTIR spectral resolution from maximum OPD, apodization, and scan parameters.'
};


const jsonLd = generateCalculatorJsonLd(
  'FTIR Resolution Calculator',
  'FTIR spectral resolution from maximum OPD, apodization, and scan parameters.',
  'https://photonics-calculators.vercel.app/spectroscopy/ftir-resolution',
  { category: 'Spectroscopy`,
  `FTIR spectral resolution from maximum OPD, apodization, and scan parameters.'
};


const jsonLd = generateCalculatorJsonLd(
  'FTIR Resolution Calculator',
  'FTIR spectral resolution from maximum OPD, apodization, and scan parameters.',
  'https://photonics-calculators.vercel.app/spectroscopy/ftir-resolution',
  { category: 'Spectroscopy`,
  `https://photonics-calculators.vercel.app/spectroscopy/ftir-resolution`,
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

import type { Metadata } from "next";
import { generateCalculatorJsonLd, JsonLdScript } from '../../../lib/json-ld';
import PageClient from "./page-client";

export const metadata: Metadata = {
    alternates: { canonical: 'https://photonics-calculators.vercel.app/wave-optics/optical-frequency-comb' },
    title: 'Optical Frequency Comb',
  description: 'Precision spectroscopy and metrology using a train of equally spaced narrow spectral lines.'
};
const jsonLd = generateCalculatorJsonLd(
  `Optical Frequency Comb',
  description: 'Precision spectroscopy and metrology using a train of equally spaced narrow spectral lines.'
};


const jsonLd = generateCalculatorJsonLd(
  'Optical Frequency Comb',
  'Precision spectroscopy and metrology using a train of equally spaced narrow spectral lines.',
  'https://photonics-calculators.vercel.app/wave-optics/optical-frequency-comb',
  { category: 'Wave Optics`,
  `Precision spectroscopy and metrology using a train of equally spaced narrow spectral lines.'
};


const jsonLd = generateCalculatorJsonLd(
  'Optical Frequency Comb',
  'Precision spectroscopy and metrology using a train of equally spaced narrow spectral lines.',
  'https://photonics-calculators.vercel.app/wave-optics/optical-frequency-comb',
  { category: 'Wave Optics`,
  `https://photonics-calculators.vercel.app/wave-optics/optical-frequency-comb`,
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

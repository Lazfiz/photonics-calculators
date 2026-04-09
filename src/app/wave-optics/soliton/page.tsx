import type { Metadata } from "next";
import { generateCalculatorJsonLd, JsonLdScript } from '../../../lib/json-ld';
import PageClient from "./page-client";

export const metadata: Metadata = {
    alternates: { canonical: 'https://photonics-calculators.vercel.app/wave-optics/soliton' },
    title: 'Soliton Propagation',
  description: 'Fundamental and higher-order soliton dynamics via split-step Fourier simulation.'
};
const jsonLd = generateCalculatorJsonLd(
  `Soliton Propagation',
  description: 'Fundamental and higher-order soliton dynamics via split-step Fourier simulation.'
};


const jsonLd = generateCalculatorJsonLd(
  'Soliton Propagation',
  'Fundamental and higher-order soliton dynamics via split-step Fourier simulation.',
  'https://photonics-calculators.vercel.app/wave-optics/soliton',
  { category: 'Wave Optics`,
  `Fundamental and higher-order soliton dynamics via split-step Fourier simulation.'
};


const jsonLd = generateCalculatorJsonLd(
  'Soliton Propagation',
  'Fundamental and higher-order soliton dynamics via split-step Fourier simulation.',
  'https://photonics-calculators.vercel.app/wave-optics/soliton',
  { category: 'Wave Optics`,
  `https://photonics-calculators.vercel.app/wave-optics/soliton`,
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

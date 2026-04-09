import type { Metadata } from "next";
import { generateCalculatorJsonLd, JsonLdScript } from '../../../lib/json-ld';
import PageClient from "./page-client";

export const metadata: Metadata = {
    alternates: { canonical: 'https://photonics-calculators.vercel.app/wave-optics/four-wave-mixing' },
    title: 'Four-Wave Mixing (FWM)',
  description: 'Degenerate FWM with energy conservation 2p = s + i in fibers and waveguides.'
};
const jsonLd = generateCalculatorJsonLd(
  `Four-Wave Mixing (FWM)',
  description: 'Degenerate FWM with energy conservation 2p = s + i in fibers and waveguides.'
};


const jsonLd = generateCalculatorJsonLd(
  'Four-Wave Mixing (FWM)',
  'Degenerate FWM with energy conservation 2p = s + i in fibers and waveguides.',
  'https://photonics-calculators.vercel.app/wave-optics/four-wave-mixing',
  { category: 'Wave Optics`,
  `Degenerate FWM with energy conservation 2p = s + i in fibers and waveguides.'
};


const jsonLd = generateCalculatorJsonLd(
  'Four-Wave Mixing (FWM)',
  'Degenerate FWM with energy conservation 2p = s + i in fibers and waveguides.',
  'https://photonics-calculators.vercel.app/wave-optics/four-wave-mixing',
  { category: 'Wave Optics`,
  `https://photonics-calculators.vercel.app/wave-optics/four-wave-mixing`,
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

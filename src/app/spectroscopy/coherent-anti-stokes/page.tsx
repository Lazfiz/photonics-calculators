import type { Metadata } from "next";
import { generateCalculatorJsonLd, JsonLdScript } from '../../../lib/json-ld';
import PageClient from "./page-client";

export const metadata: Metadata = {
    alternates: { canonical: 'https://photonics-calculators.vercel.app/spectroscopy/coherent-anti-stokes' },
    title: 'Coherent Anti-Stokes Raman Spectroscopy (CARS)',
  description: 'Four-wave mixing process: _CARS = _pump − _Stokes + _probe. Coherent, directional signal above fluorescence.'
};
const jsonLd = generateCalculatorJsonLd(
  `Coherent Anti-Stokes Raman Spectroscopy (CARS)',
  description: 'Four-wave mixing process: _CARS = _pump − _Stokes + _probe. Coherent, directional signal above fluorescence.'
};


const jsonLd = generateCalculatorJsonLd(
  'Coherent Anti-Stokes Raman Spectroscopy (CARS)',
  'Four-wave mixing process: _CARS = _pump − _Stokes + _probe. Coherent, directional signal above fluorescence.',
  'https://photonics-calculators.vercel.app/spectroscopy/coherent-anti-stokes',
  { category: 'Spectroscopy`,
  `Four-wave mixing process: _CARS = _pump − _Stokes + _probe. Coherent, directional signal above fluorescence.'
};


const jsonLd = generateCalculatorJsonLd(
  'Coherent Anti-Stokes Raman Spectroscopy (CARS)',
  'Four-wave mixing process: _CARS = _pump − _Stokes + _probe. Coherent, directional signal above fluorescence.',
  'https://photonics-calculators.vercel.app/spectroscopy/coherent-anti-stokes',
  { category: 'Spectroscopy`,
  `https://photonics-calculators.vercel.app/spectroscopy/coherent-anti-stokes`,
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

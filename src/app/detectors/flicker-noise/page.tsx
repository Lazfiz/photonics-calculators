import type { Metadata } from "next";
import { generateCalculatorJsonLd, JsonLdScript } from '../../../lib/json-ld';
import PageClient from "./page-client";

export const metadata: Metadata = {
    alternates: { canonical: 'https://photonics-calculators.vercel.app/detectors/flicker-noise' },
      title: '1/f Flicker Noise',
  description: 'Flicker noise: S_v(f) = K_f I^ / f. Noise spectral density falls as 1/f.',
};
const jsonLd = generateCalculatorJsonLd(
  `1/f Flicker Noise',
  description: 'Flicker noise: S_v(f) = K_f I^ / f. Noise spectral density falls as 1/f.',
};


const jsonLd = generateCalculatorJsonLd(
  '1/f Flicker Noise',
  'Flicker noise: S_v(f) = K_f I^ / f. Noise spectral density falls as 1/f.',
  'https://photonics-calculators.vercel.app/detectors/flicker-noise',
  { category: 'Detectors`,
  `Flicker noise: S_v(f) = K_f I^ / f. Noise spectral density falls as 1/f.',
};


const jsonLd = generateCalculatorJsonLd(
  '1/f Flicker Noise',
  'Flicker noise: S_v(f) = K_f I^ / f. Noise spectral density falls as 1/f.',
  'https://photonics-calculators.vercel.app/detectors/flicker-noise',
  { category: 'Detectors`,
  `https://photonics-calculators.vercel.app/detectors/flicker-noise`,
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

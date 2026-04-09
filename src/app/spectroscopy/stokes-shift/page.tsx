import type { Metadata } from "next";
import { generateCalculatorJsonLd, JsonLdScript } from '../../../lib/json-ld';
import PageClient from "./page-client";

export const metadata: Metadata = {
    alternates: { canonical: 'https://photonics-calculators.vercel.app/spectroscopy/stokes-shift' },
    title: 'Stokes Shift Calculator',
  description: '̃ = ̃_abs − ̃_em — energy difference between absorption and emission maxima.'
};
const jsonLd = generateCalculatorJsonLd(
  `Stokes Shift Calculator',
  description: '̃ = ̃_abs − ̃_em — energy difference between absorption and emission maxima.'
};


const jsonLd = generateCalculatorJsonLd(
  'Stokes Shift Calculator',
  '̃ = ̃_abs − ̃_em — energy difference between absorption and emission maxima.',
  'https://photonics-calculators.vercel.app/spectroscopy/stokes-shift',
  { category: 'Spectroscopy`,
  `̃ = ̃_abs − ̃_em — energy difference between absorption and emission maxima.'
};


const jsonLd = generateCalculatorJsonLd(
  'Stokes Shift Calculator',
  '̃ = ̃_abs − ̃_em — energy difference between absorption and emission maxima.',
  'https://photonics-calculators.vercel.app/spectroscopy/stokes-shift',
  { category: 'Spectroscopy`,
  `https://photonics-calculators.vercel.app/spectroscopy/stokes-shift`,
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

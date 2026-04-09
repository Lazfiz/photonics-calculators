import type { Metadata } from "next";
import { generateCalculatorJsonLd, JsonLdScript } from '../../../lib/json-ld';
import PageClient from "./page-client";

export const metadata: Metadata = {
    alternates: { canonical: 'https://photonics-calculators.vercel.app/imaging/psf-calculator' },
    title: 'Point Spread Function Calculator',
  description: 'Visualize the 2D and 1D point spread function (PSF) for a diffraction-limited system.'
};
const jsonLd = generateCalculatorJsonLd(
  `Point Spread Function Calculator',
  description: 'Visualize the 2D and 1D point spread function (PSF) for a diffraction-limited system.'
};


const jsonLd = generateCalculatorJsonLd(
  'Point Spread Function Calculator',
  'Visualize the 2D and 1D point spread function (PSF) for a diffraction-limited system.',
  'https://photonics-calculators.vercel.app/imaging/psf-calculator',
  { category: 'Imaging`,
  `Visualize the 2D and 1D point spread function (PSF) for a diffraction-limited system.'
};


const jsonLd = generateCalculatorJsonLd(
  'Point Spread Function Calculator',
  'Visualize the 2D and 1D point spread function (PSF) for a diffraction-limited system.',
  'https://photonics-calculators.vercel.app/imaging/psf-calculator',
  { category: 'Imaging`,
  `https://photonics-calculators.vercel.app/imaging/psf-calculator`,
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

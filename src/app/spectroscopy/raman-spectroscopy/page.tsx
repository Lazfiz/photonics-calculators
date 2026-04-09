import type { Metadata } from "next";
import { generateCalculatorJsonLd, JsonLdScript } from '../../../lib/json-ld';
import PageClient from "./page-client";

export const metadata: Metadata = {
    alternates: { canonical: 'https://photonics-calculators.vercel.app/spectroscopy/raman-spectroscopy' },
    title: 'Raman Spectroscopy',
  description: 'Stokes and anti-Stokes wavelength shift vs Raman shift. Inelastic scattering fundamentals.'
};
const jsonLd = generateCalculatorJsonLd(
  `Raman Spectroscopy',
  description: 'Stokes and anti-Stokes wavelength shift vs Raman shift. Inelastic scattering fundamentals.'
};


const jsonLd = generateCalculatorJsonLd(
  'Raman Spectroscopy',
  'Stokes and anti-Stokes wavelength shift vs Raman shift. Inelastic scattering fundamentals.',
  'https://photonics-calculators.vercel.app/spectroscopy/raman-spectroscopy',
  { category: 'Spectroscopy`,
  `Stokes and anti-Stokes wavelength shift vs Raman shift. Inelastic scattering fundamentals.'
};


const jsonLd = generateCalculatorJsonLd(
  'Raman Spectroscopy',
  'Stokes and anti-Stokes wavelength shift vs Raman shift. Inelastic scattering fundamentals.',
  'https://photonics-calculators.vercel.app/spectroscopy/raman-spectroscopy',
  { category: 'Spectroscopy`,
  `https://photonics-calculators.vercel.app/spectroscopy/raman-spectroscopy`,
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

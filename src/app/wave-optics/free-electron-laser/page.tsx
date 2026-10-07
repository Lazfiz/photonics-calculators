import type { Metadata } from "next";
import { generateCalculatorJsonLd, JsonLdScript } from '../../../lib/json-ld';
import PageClient from "./page-client";

export const metadata: Metadata = {
    alternates: { canonical: 'https://photonics-calculators.vercel.app/wave-optics/free-electron-laser' },
    title: 'Free-Electron Laser',
  description: 'FEL resonance wavelength, Pierce parameter ρ, 1D gain length and saturation power from electron energy, undulator period, K and peak current.'
};

const jsonLd = generateCalculatorJsonLd(
  'Free-Electron Laser',
  'FEL resonance wavelength, Pierce parameter ρ, 1D gain length and saturation power from electron energy, undulator period, K and peak current.',
  'https://photonics-calculators.vercel.app/wave-optics/free-electron-laser',
  { category: 'Wave Optics' }
);

export default function Page() {
  return (
    <>
      <JsonLdScript data={jsonLd} />
      <PageClient />
    </>
  );
}

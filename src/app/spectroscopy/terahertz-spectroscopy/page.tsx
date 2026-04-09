import type { Metadata } from "next";
import { generateCalculatorJsonLd, JsonLdScript } from '../../../lib/json-ld';
import PageClient from "./page-client";

export const metadata: Metadata = {
    alternates: { canonical: 'https://photonics-calculators.vercel.app/spectroscopy/terahertz-spectroscopy' },
    title: 'Terahertz (THz) Spectroscopy',
  description: 'Probing low-energy excitations: phonon modes, hydrogen bonding, lattice vibrations (0.1–10 THz).',
};
const jsonLd = generateCalculatorJsonLd(
  `Terahertz (THz) Spectroscopy',
  description: 'Probing low-energy excitations: phonon modes, hydrogen bonding, lattice vibrations (0.1–10 THz).',
};


const jsonLd = generateCalculatorJsonLd(
  'Terahertz (THz) Spectroscopy',
  'Probing low-energy excitations: phonon modes, hydrogen bonding, lattice vibrations (0.1–10 THz).',
  'https://photonics-calculators.vercel.app/spectroscopy/terahertz-spectroscopy',
  { category: 'Spectroscopy`,
  `Probing low-energy excitations: phonon modes, hydrogen bonding, lattice vibrations (0.1–10 THz).',
};


const jsonLd = generateCalculatorJsonLd(
  'Terahertz (THz) Spectroscopy',
  'Probing low-energy excitations: phonon modes, hydrogen bonding, lattice vibrations (0.1–10 THz).',
  'https://photonics-calculators.vercel.app/spectroscopy/terahertz-spectroscopy',
  { category: 'Spectroscopy`,
  `https://photonics-calculators.vercel.app/spectroscopy/terahertz-spectroscopy`,
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

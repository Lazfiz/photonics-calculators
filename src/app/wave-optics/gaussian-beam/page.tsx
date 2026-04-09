import type { Metadata } from "next";
import { generateCalculatorJsonLd, JsonLdScript } from '../../../lib/json-ld';
import PageClient from "./page-client";

export const metadata: Metadata = {
    alternates: { canonical: 'https://photonics-calculators.vercel.app/wave-optics/gaussian-beam' },
    title: 'Gaussian Beam Propagation',
  description: 'Explore how wavelength and waist size shape Rayleigh range, divergence, and Gaussian beam envelope.'
};
const jsonLd = generateCalculatorJsonLd(
  `Gaussian Beam Propagation',
  description: 'Explore how wavelength and waist size shape Rayleigh range, divergence, and Gaussian beam envelope.'
};


const jsonLd = generateCalculatorJsonLd(
  'Gaussian Beam Propagation',
  'Explore how wavelength and waist size shape Rayleigh range, divergence, and Gaussian beam envelope.',
  'https://photonics-calculators.vercel.app/wave-optics/gaussian-beam',
  { category: 'Wave Optics`,
  `Explore how wavelength and waist size shape Rayleigh range, divergence, and Gaussian beam envelope.'
};


const jsonLd = generateCalculatorJsonLd(
  'Gaussian Beam Propagation',
  'Explore how wavelength and waist size shape Rayleigh range, divergence, and Gaussian beam envelope.',
  'https://photonics-calculators.vercel.app/wave-optics/gaussian-beam',
  { category: 'Wave Optics`,
  `https://photonics-calculators.vercel.app/wave-optics/gaussian-beam`,
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

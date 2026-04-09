import type { Metadata } from "next";
import { generateCalculatorJsonLd, JsonLdScript } from '../../../lib/json-ld';
import PageClient from "./page-client";

export const metadata: Metadata = {
    alternates: { canonical: 'https://photonics-calculators.vercel.app/imaging/third-harmonic-microscopy' },
    title: 'Third-Harmonic Generation Microscopy Calculator',
  description: 'Calculate THG wavelength, signal intensity, and resolution for label-free interface and heterogeneity imaging.'
};
const jsonLd = generateCalculatorJsonLd(
  `Third-Harmonic Generation Microscopy Calculator',
  description: 'Calculate THG wavelength, signal intensity, and resolution for label-free interface and heterogeneity imaging.'
};


const jsonLd = generateCalculatorJsonLd(
  'Third-Harmonic Generation Microscopy Calculator',
  'Calculate THG wavelength, signal intensity, and resolution for label-free interface and heterogeneity imaging.',
  'https://photonics-calculators.vercel.app/imaging/third-harmonic-microscopy',
  { category: 'Imaging`,
  `Calculate THG wavelength, signal intensity, and resolution for label-free interface and heterogeneity imaging.'
};


const jsonLd = generateCalculatorJsonLd(
  'Third-Harmonic Generation Microscopy Calculator',
  'Calculate THG wavelength, signal intensity, and resolution for label-free interface and heterogeneity imaging.',
  'https://photonics-calculators.vercel.app/imaging/third-harmonic-microscopy',
  { category: 'Imaging`,
  `https://photonics-calculators.vercel.app/imaging/third-harmonic-microscopy`,
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

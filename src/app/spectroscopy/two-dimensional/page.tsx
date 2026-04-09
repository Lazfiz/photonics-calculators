import type { Metadata } from "next";
import { generateCalculatorJsonLd, JsonLdScript } from '../../../lib/json-ld';
import PageClient from "./page-client";

export const metadata: Metadata = {
    alternates: { canonical: 'https://photonics-calculators.vercel.app/spectroscopy/two-dimensional' },
    title: 'Two-Dimensional (2D) Spectroscopy',
  description: 'Correlates excitation and detection frequencies via three-pulse photon echo. Reveals coupling, energy transfer, and homogeneous vs inhomogeneous broadening.'
};
const jsonLd = generateCalculatorJsonLd(
  `Two-Dimensional (2D) Spectroscopy',
  description: 'Correlates excitation and detection frequencies via three-pulse photon echo. Reveals coupling, energy transfer, and homogeneous vs inhomogeneous broadening.'
};


const jsonLd = generateCalculatorJsonLd(
  'Two-Dimensional (2D) Spectroscopy',
  'Correlates excitation and detection frequencies via three-pulse photon echo. Reveals coupling, energy transfer, and homogeneous vs inhomogeneous broadening.',
  'https://photonics-calculators.vercel.app/spectroscopy/two-dimensional',
  { category: 'Spectroscopy`,
  `Correlates excitation and detection frequencies via three-pulse photon echo. Reveals coupling, energy transfer, and homogeneous vs inhomogeneous broadening.'
};


const jsonLd = generateCalculatorJsonLd(
  'Two-Dimensional (2D) Spectroscopy',
  'Correlates excitation and detection frequencies via three-pulse photon echo. Reveals coupling, energy transfer, and homogeneous vs inhomogeneous broadening.',
  'https://photonics-calculators.vercel.app/spectroscopy/two-dimensional',
  { category: 'Spectroscopy`,
  `https://photonics-calculators.vercel.app/spectroscopy/two-dimensional`,
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

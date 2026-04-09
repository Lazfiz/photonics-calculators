import type { Metadata } from "next";
import { generateCalculatorJsonLd, JsonLdScript } from '../../../lib/json-ld';
import PageClient from "./page-client";

export const metadata: Metadata = {
    alternates: { canonical: 'https://photonics-calculators.vercel.app/spectroscopy/optical-density' },
    title: 'Optical Density',
  description: 'Convert optical density, transmission, and attenuation with interactive presets and slider-based exploration.'
};
const jsonLd = generateCalculatorJsonLd(
  `Optical Density',
  description: 'Convert optical density, transmission, and attenuation with interactive presets and slider-based exploration.'
};


const jsonLd = generateCalculatorJsonLd(
  'Optical Density',
  'Convert optical density, transmission, and attenuation with interactive presets and slider-based exploration.',
  'https://photonics-calculators.vercel.app/spectroscopy/optical-density',
  { category: 'Spectroscopy`,
  `Convert optical density, transmission, and attenuation with interactive presets and slider-based exploration.'
};


const jsonLd = generateCalculatorJsonLd(
  'Optical Density',
  'Convert optical density, transmission, and attenuation with interactive presets and slider-based exploration.',
  'https://photonics-calculators.vercel.app/spectroscopy/optical-density',
  { category: 'Spectroscopy`,
  `https://photonics-calculators.vercel.app/spectroscopy/optical-density`,
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

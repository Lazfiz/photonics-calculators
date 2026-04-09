import type { Metadata } from "next";
import { generateCalculatorJsonLd, JsonLdScript } from '../../../lib/json-ld';
import PageClient from "./page-client";

export const metadata: Metadata = {
    alternates: { canonical: 'https://photonics-calculators.vercel.app/spectroscopy/lambert-beer-law' },
    title: 'Lambert-Beer Law Calculator',
  description: 'Beer-Lambert absorbance, optical density, and transmission with interactive parameter sweeps.'
};
const jsonLd = generateCalculatorJsonLd(
  `Lambert-Beer Law Calculator',
  description: 'Beer-Lambert absorbance, optical density, and transmission with interactive parameter sweeps.'
};


const jsonLd = generateCalculatorJsonLd(
  'Lambert-Beer Law Calculator',
  'Beer-Lambert absorbance, optical density, and transmission with interactive parameter sweeps.',
  'https://photonics-calculators.vercel.app/spectroscopy/lambert-beer-law',
  { category: 'Spectroscopy`,
  `Beer-Lambert absorbance, optical density, and transmission with interactive parameter sweeps.'
};


const jsonLd = generateCalculatorJsonLd(
  'Lambert-Beer Law Calculator',
  'Beer-Lambert absorbance, optical density, and transmission with interactive parameter sweeps.',
  'https://photonics-calculators.vercel.app/spectroscopy/lambert-beer-law',
  { category: 'Spectroscopy`,
  `https://photonics-calculators.vercel.app/spectroscopy/lambert-beer-law`,
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

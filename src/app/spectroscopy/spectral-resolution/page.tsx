import type { Metadata } from "next";
import { generateCalculatorJsonLd, JsonLdScript } from '../../../lib/json-ld';
import PageClient from "./page-client";

export const metadata: Metadata = {
    alternates: { canonical: 'https://photonics-calculators.vercel.app/spectroscopy/spectral-resolution' },
    title: 'Spectral Resolution Calculator',
  description: 'Compare spectral resolution across grating, prism, and Fabry-Pérot spectrometers.'
};
const jsonLd = generateCalculatorJsonLd(
  `Spectral Resolution Calculator',
  description: 'Compare spectral resolution across grating, prism, and Fabry-Pérot spectrometers.'
};


const jsonLd = generateCalculatorJsonLd(
  'Spectral Resolution Calculator',
  'Compare spectral resolution across grating, prism, and Fabry-Pérot spectrometers.',
  'https://photonics-calculators.vercel.app/spectroscopy/spectral-resolution',
  { category: 'Spectroscopy`,
  `Compare spectral resolution across grating, prism, and Fabry-Pérot spectrometers.'
};


const jsonLd = generateCalculatorJsonLd(
  'Spectral Resolution Calculator',
  'Compare spectral resolution across grating, prism, and Fabry-Pérot spectrometers.',
  'https://photonics-calculators.vercel.app/spectroscopy/spectral-resolution',
  { category: 'Spectroscopy`,
  `https://photonics-calculators.vercel.app/spectroscopy/spectral-resolution`,
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

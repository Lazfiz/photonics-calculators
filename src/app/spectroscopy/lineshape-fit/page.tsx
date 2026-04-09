import type { Metadata } from "next";
import { generateCalculatorJsonLd, JsonLdScript } from '../../../lib/json-ld';
import PageClient from "./page-client";

export const metadata: Metadata = {
    alternates: { canonical: 'https://photonics-calculators.vercel.app/spectroscopy/lineshape-fit' },
    title: 'Lineshape Fitting',
  description: 'Voigt, Gaussian, and Lorentzian line profiles — compare convolution effects on spectral lines.'
};
const jsonLd = generateCalculatorJsonLd(
  `Lineshape Fitting',
  description: 'Voigt, Gaussian, and Lorentzian line profiles — compare convolution effects on spectral lines.'
};


const jsonLd = generateCalculatorJsonLd(
  'Lineshape Fitting',
  'Voigt, Gaussian, and Lorentzian line profiles — compare convolution effects on spectral lines.',
  'https://photonics-calculators.vercel.app/spectroscopy/lineshape-fit',
  { category: 'Spectroscopy`,
  `Voigt, Gaussian, and Lorentzian line profiles — compare convolution effects on spectral lines.'
};


const jsonLd = generateCalculatorJsonLd(
  'Lineshape Fitting',
  'Voigt, Gaussian, and Lorentzian line profiles — compare convolution effects on spectral lines.',
  'https://photonics-calculators.vercel.app/spectroscopy/lineshape-fit',
  { category: 'Spectroscopy`,
  `https://photonics-calculators.vercel.app/spectroscopy/lineshape-fit`,
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

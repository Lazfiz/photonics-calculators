import type { Metadata } from "next";
import { generateCalculatorJsonLd, JsonLdScript } from '../../../lib/json-ld';
import PageClient from "./page-client";

export const metadata: Metadata = {
    alternates: { canonical: 'https://photonics-calculators.vercel.app/wave-optics/diffraction-integral' },
    title: 'Diffraction Integral Calculator',
  description: 'Fresnel/Kirchhoff diffraction patterns.'
};
const jsonLd = generateCalculatorJsonLd(
  `Diffraction Integral Calculator',
  description: 'Fresnel/Kirchhoff diffraction patterns.'
};


const jsonLd = generateCalculatorJsonLd(
  'Diffraction Integral Calculator',
  'Fresnel/Kirchhoff diffraction patterns.',
  'https://photonics-calculators.vercel.app/wave-optics/diffraction-integral',
  { category: 'Wave Optics`,
  `Fresnel/Kirchhoff diffraction patterns.'
};


const jsonLd = generateCalculatorJsonLd(
  'Diffraction Integral Calculator',
  'Fresnel/Kirchhoff diffraction patterns.',
  'https://photonics-calculators.vercel.app/wave-optics/diffraction-integral',
  { category: 'Wave Optics`,
  `https://photonics-calculators.vercel.app/wave-optics/diffraction-integral`,
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

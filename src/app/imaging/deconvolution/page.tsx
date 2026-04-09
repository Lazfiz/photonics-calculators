import type { Metadata } from "next";
import { generateCalculatorJsonLd, JsonLdScript } from '../../../lib/json-ld';
import PageClient from "./page-client";

export const metadata: Metadata = {
    alternates: { canonical: 'https://photonics-calculators.vercel.app/imaging/deconvolution' },
    title: 'Image Deconvolution',
  description: 'Compare deconvolution algorithms: OTF analysis, convergence behavior, and resolution recovery.'
};
const jsonLd = generateCalculatorJsonLd(
  `Image Deconvolution',
  description: 'Compare deconvolution algorithms: OTF analysis, convergence behavior, and resolution recovery.'
};


const jsonLd = generateCalculatorJsonLd(
  'Image Deconvolution',
  'Compare deconvolution algorithms: OTF analysis, convergence behavior, and resolution recovery.',
  'https://photonics-calculators.vercel.app/imaging/deconvolution',
  { category: 'Imaging`,
  `Compare deconvolution algorithms: OTF analysis, convergence behavior, and resolution recovery.'
};


const jsonLd = generateCalculatorJsonLd(
  'Image Deconvolution',
  'Compare deconvolution algorithms: OTF analysis, convergence behavior, and resolution recovery.',
  'https://photonics-calculators.vercel.app/imaging/deconvolution',
  { category: 'Imaging`,
  `https://photonics-calculators.vercel.app/imaging/deconvolution`,
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

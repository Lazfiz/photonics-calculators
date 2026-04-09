import type { Metadata } from "next";
import { generateCalculatorJsonLd, JsonLdScript } from '../../../lib/json-ld';
import PageClient from "./page-client";

export const metadata: Metadata = {
    alternates: { canonical: 'https://photonics-calculators.vercel.app/imaging/stitching' },
    title: 'Image Stitching',
  description: 'Calculate tile grid parameters, overlap, blending profiles, and stitching accuracy for large-area microscopy.'
};
const jsonLd = generateCalculatorJsonLd(
  `Image Stitching',
  description: 'Calculate tile grid parameters, overlap, blending profiles, and stitching accuracy for large-area microscopy.'
};


const jsonLd = generateCalculatorJsonLd(
  'Image Stitching',
  'Calculate tile grid parameters, overlap, blending profiles, and stitching accuracy for large-area microscopy.',
  'https://photonics-calculators.vercel.app/imaging/stitching',
  { category: 'Imaging`,
  `Calculate tile grid parameters, overlap, blending profiles, and stitching accuracy for large-area microscopy.'
};


const jsonLd = generateCalculatorJsonLd(
  'Image Stitching',
  'Calculate tile grid parameters, overlap, blending profiles, and stitching accuracy for large-area microscopy.',
  'https://photonics-calculators.vercel.app/imaging/stitching',
  { category: 'Imaging`,
  `https://photonics-calculators.vercel.app/imaging/stitching`,
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

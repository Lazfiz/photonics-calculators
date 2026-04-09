import type { Metadata } from "next";
import { generateCalculatorJsonLd, JsonLdScript } from '../../../lib/json-ld';
import PageClient from "./page-client";

export const metadata: Metadata = {
    alternates: { canonical: 'https://photonics-calculators.vercel.app/imaging/optical-sectioning' },
    title: 'Optical Sectioning Calculator',
  description: 'Optical section thickness for confocal and widefield microscopy.'
};
const jsonLd = generateCalculatorJsonLd(
  `Optical Sectioning Calculator',
  description: 'Optical section thickness for confocal and widefield microscopy.'
};


const jsonLd = generateCalculatorJsonLd(
  'Optical Sectioning Calculator',
  'Optical section thickness for confocal and widefield microscopy.',
  'https://photonics-calculators.vercel.app/imaging/optical-sectioning',
  { category: 'Imaging`,
  `Optical section thickness for confocal and widefield microscopy.'
};


const jsonLd = generateCalculatorJsonLd(
  'Optical Sectioning Calculator',
  'Optical section thickness for confocal and widefield microscopy.',
  'https://photonics-calculators.vercel.app/imaging/optical-sectioning',
  { category: 'Imaging`,
  `https://photonics-calculators.vercel.app/imaging/optical-sectioning`,
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

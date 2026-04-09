import type { Metadata } from "next";
import { generateCalculatorJsonLd, JsonLdScript } from '../../../lib/json-ld';
import PageClient from "./page-client";

export const metadata: Metadata = {
    alternates: { canonical: 'https://photonics-calculators.vercel.app/imaging/spinning-disk' },
    title: 'Spinning Disk Confocal Calculator',
  description: 'Pinhole size, optical sectioning, and frame rate for spinning disk confocal microscopy.'
};
const jsonLd = generateCalculatorJsonLd(
  `Spinning Disk Confocal Calculator',
  description: 'Pinhole size, optical sectioning, and frame rate for spinning disk confocal microscopy.'
};


const jsonLd = generateCalculatorJsonLd(
  'Spinning Disk Confocal Calculator',
  'Pinhole size, optical sectioning, and frame rate for spinning disk confocal microscopy.',
  'https://photonics-calculators.vercel.app/imaging/spinning-disk',
  { category: 'Imaging`,
  `Pinhole size, optical sectioning, and frame rate for spinning disk confocal microscopy.'
};


const jsonLd = generateCalculatorJsonLd(
  'Spinning Disk Confocal Calculator',
  'Pinhole size, optical sectioning, and frame rate for spinning disk confocal microscopy.',
  'https://photonics-calculators.vercel.app/imaging/spinning-disk',
  { category: 'Imaging`,
  `https://photonics-calculators.vercel.app/imaging/spinning-disk`,
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

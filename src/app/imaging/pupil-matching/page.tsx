import type { Metadata } from "next";
import { generateCalculatorJsonLd, JsonLdScript } from '../../../lib/json-ld';
import PageClient from "./page-client";

export const metadata: Metadata = {
    alternates: { canonical: 'https://photonics-calculators.vercel.app/imaging/pupil-matching' },
      title: 'Pupil Matching in Microscopy',
  description: 'Exit pupil = (2ftubeNA)/(MobjMeyepiece). Match to eye pupil (2-8mm) for optimal brightness.',
};
const jsonLd = generateCalculatorJsonLd(
  `Pupil Matching in Microscopy',
  description: 'Exit pupil = (2ftubeNA)/(MobjMeyepiece). Match to eye pupil (2-8mm) for optimal brightness.',
};


const jsonLd = generateCalculatorJsonLd(
  'Pupil Matching in Microscopy',
  'Exit pupil = (2ftubeNA)/(MobjMeyepiece). Match to eye pupil (2-8mm) for optimal brightness.',
  'https://photonics-calculators.vercel.app/imaging/pupil-matching',
  { category: 'Imaging`,
  `Exit pupil = (2ftubeNA)/(MobjMeyepiece). Match to eye pupil (2-8mm) for optimal brightness.',
};


const jsonLd = generateCalculatorJsonLd(
  'Pupil Matching in Microscopy',
  'Exit pupil = (2ftubeNA)/(MobjMeyepiece). Match to eye pupil (2-8mm) for optimal brightness.',
  'https://photonics-calculators.vercel.app/imaging/pupil-matching',
  { category: 'Imaging`,
  `https://photonics-calculators.vercel.app/imaging/pupil-matching`,
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

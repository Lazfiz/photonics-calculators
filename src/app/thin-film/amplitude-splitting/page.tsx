import type { Metadata } from "next";
import { generateCalculatorJsonLd, JsonLdScript } from '../../../lib/json-ld';
import PageClient from "./page-client";

export const metadata: Metadata = {
    alternates: { canonical: 'https://photonics-calculators.vercel.app/thin-film/amplitude-splitting' },
    title: 'Amplitude Splitting',
  description: 'Multiple-beam interference from amplitude splitting at a thin film. Shows how partial reflections from each interface combine to form interference fringes.'
};
const jsonLd = generateCalculatorJsonLd(
  `Amplitude Splitting',
  description: 'Multiple-beam interference from amplitude splitting at a thin film. Shows how partial reflections from each interface combine to form interference fringes.'
};


const jsonLd = generateCalculatorJsonLd(
  'Amplitude Splitting',
  'Multiple-beam interference from amplitude splitting at a thin film. Shows how partial reflections from each interface combine to form interference fringes.',
  'https://photonics-calculators.vercel.app/thin-film/amplitude-splitting',
  { category: 'Thin Film`,
  `Multiple-beam interference from amplitude splitting at a thin film. Shows how partial reflections from each interface combine to form interference fringes.'
};


const jsonLd = generateCalculatorJsonLd(
  'Amplitude Splitting',
  'Multiple-beam interference from amplitude splitting at a thin film. Shows how partial reflections from each interface combine to form interference fringes.',
  'https://photonics-calculators.vercel.app/thin-film/amplitude-splitting',
  { category: 'Thin Film`,
  `https://photonics-calculators.vercel.app/thin-film/amplitude-splitting`,
  { category: `Thin Film` }
);
export default function Page() {
  return (
    <>
      <JsonLdScript data={jsonLd} />
      <PageClient />
    </>
  );
}

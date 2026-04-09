import type { Metadata } from "next";
import { generateCalculatorJsonLd, JsonLdScript } from '../../../lib/json-ld';
import PageClient from "./page-client";

export const metadata: Metadata = {
    alternates: { canonical: 'https://photonics-calculators.vercel.app/spectroscopy/sum-frequency-gen' },
    title: 'Sum Frequency Generation Spectroscopy',
  description: 'Surface-specific vibrational probe. SFG is forbidden in centrosymmetric media — only surfaces and interfaces contribute.'
};
const jsonLd = generateCalculatorJsonLd(
  `Sum Frequency Generation Spectroscopy',
  description: 'Surface-specific vibrational probe. SFG is forbidden in centrosymmetric media — only surfaces and interfaces contribute.'
};


const jsonLd = generateCalculatorJsonLd(
  'Sum Frequency Generation Spectroscopy',
  'Surface-specific vibrational probe. SFG is forbidden in centrosymmetric media — only surfaces and interfaces contribute.',
  'https://photonics-calculators.vercel.app/spectroscopy/sum-frequency-gen',
  { category: 'Spectroscopy`,
  `Surface-specific vibrational probe. SFG is forbidden in centrosymmetric media — only surfaces and interfaces contribute.'
};


const jsonLd = generateCalculatorJsonLd(
  'Sum Frequency Generation Spectroscopy',
  'Surface-specific vibrational probe. SFG is forbidden in centrosymmetric media — only surfaces and interfaces contribute.',
  'https://photonics-calculators.vercel.app/spectroscopy/sum-frequency-gen',
  { category: 'Spectroscopy`,
  `https://photonics-calculators.vercel.app/spectroscopy/sum-frequency-gen`,
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

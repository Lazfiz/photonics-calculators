import type { Metadata } from "next";
import { generateCalculatorJsonLd, JsonLdScript } from '../../../lib/json-ld';
import PageClient from "./page-client";

export const metadata: Metadata = {
    alternates: { canonical: 'https://photonics-calculators.vercel.app/imaging/computer-generated-holography' },
    title: 'Computer-Generated Holography',
  description: 'CGH fundamentals: SLM parameters, diffraction efficiency, hologram memory, and reconstruction geometry.'
};
const jsonLd = generateCalculatorJsonLd(
  `Computer-Generated Holography',
  description: 'CGH fundamentals: SLM parameters, diffraction efficiency, hologram memory, and reconstruction geometry.'
};


const jsonLd = generateCalculatorJsonLd(
  'Computer-Generated Holography',
  'CGH fundamentals: SLM parameters, diffraction efficiency, hologram memory, and reconstruction geometry.',
  'https://photonics-calculators.vercel.app/imaging/computer-generated-holography',
  { category: 'Imaging`,
  `CGH fundamentals: SLM parameters, diffraction efficiency, hologram memory, and reconstruction geometry.'
};


const jsonLd = generateCalculatorJsonLd(
  'Computer-Generated Holography',
  'CGH fundamentals: SLM parameters, diffraction efficiency, hologram memory, and reconstruction geometry.',
  'https://photonics-calculators.vercel.app/imaging/computer-generated-holography',
  { category: 'Imaging`,
  `https://photonics-calculators.vercel.app/imaging/computer-generated-holography`,
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

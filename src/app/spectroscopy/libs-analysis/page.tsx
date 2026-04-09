import type { Metadata } from "next";
import { generateCalculatorJsonLd, JsonLdScript } from '../../../lib/json-ld';
import PageClient from "./page-client";

export const metadata: Metadata = {
    alternates: { canonical: 'https://photonics-calculators.vercel.app/spectroscopy/libs-analysis' },
    title: 'LIBS Analysis Calculator',
  description: 'Laser-Induced Breakdown Spectroscopy: model plasma line broadening (Stark + Doppler) and estimate plasma conditions.'
};
const jsonLd = generateCalculatorJsonLd(
  `LIBS Analysis Calculator',
  description: 'Laser-Induced Breakdown Spectroscopy: model plasma line broadening (Stark + Doppler) and estimate plasma conditions.'
};


const jsonLd = generateCalculatorJsonLd(
  'LIBS Analysis Calculator',
  'Laser-Induced Breakdown Spectroscopy: model plasma line broadening (Stark + Doppler) and estimate plasma conditions.',
  'https://photonics-calculators.vercel.app/spectroscopy/libs-analysis',
  { category: 'Spectroscopy`,
  `Laser-Induced Breakdown Spectroscopy: model plasma line broadening (Stark + Doppler) and estimate plasma conditions.'
};


const jsonLd = generateCalculatorJsonLd(
  'LIBS Analysis Calculator',
  'Laser-Induced Breakdown Spectroscopy: model plasma line broadening (Stark + Doppler) and estimate plasma conditions.',
  'https://photonics-calculators.vercel.app/spectroscopy/libs-analysis',
  { category: 'Spectroscopy`,
  `https://photonics-calculators.vercel.app/spectroscopy/libs-analysis`,
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

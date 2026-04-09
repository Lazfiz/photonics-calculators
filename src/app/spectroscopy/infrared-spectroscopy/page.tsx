import type { Metadata } from "next";
import { generateCalculatorJsonLd, JsonLdScript } from '../../../lib/json-ld';
import PageClient from "./page-client";

export const metadata: Metadata = {
    alternates: { canonical: 'https://photonics-calculators.vercel.app/spectroscopy/infrared-spectroscopy' },
    title: 'Infrared (IR) Spectroscopy',
  description: 'Molecular vibrational absorption in the mid-infrared region (400–4000 cm⁻¹).',
};
const jsonLd = generateCalculatorJsonLd(
  `Infrared (IR) Spectroscopy',
  description: 'Molecular vibrational absorption in the mid-infrared region (400–4000 cm⁻¹).',
};


const jsonLd = generateCalculatorJsonLd(
  'Infrared (IR) Spectroscopy',
  'Molecular vibrational absorption in the mid-infrared region (400–4000 cm⁻¹).',
  'https://photonics-calculators.vercel.app/spectroscopy/infrared-spectroscopy',
  { category: 'Spectroscopy`,
  `Molecular vibrational absorption in the mid-infrared region (400–4000 cm⁻¹).',
};


const jsonLd = generateCalculatorJsonLd(
  'Infrared (IR) Spectroscopy',
  'Molecular vibrational absorption in the mid-infrared region (400–4000 cm⁻¹).',
  'https://photonics-calculators.vercel.app/spectroscopy/infrared-spectroscopy',
  { category: 'Spectroscopy`,
  `https://photonics-calculators.vercel.app/spectroscopy/infrared-spectroscopy`,
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

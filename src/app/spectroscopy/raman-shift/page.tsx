import type { Metadata } from "next";
import { generateCalculatorJsonLd, JsonLdScript } from '../../../lib/json-ld';
import PageClient from "./page-client";

export const metadata: Metadata = {
    alternates: { canonical: 'https://photonics-calculators.vercel.app/spectroscopy/raman-shift' },
    title: 'Raman Shift Calculator',
  description: 'Convert between Raman shift (cm⁻¹), scattered wavelength, and energy for any excitation laser.'
};
const jsonLd = generateCalculatorJsonLd(
  `Raman Shift Calculator',
  description: 'Convert between Raman shift (cm⁻¹), scattered wavelength, and energy for any excitation laser.'
};


const jsonLd = generateCalculatorJsonLd(
  'Raman Shift Calculator',
  'Convert between Raman shift (cm⁻¹), scattered wavelength, and energy for any excitation laser.',
  'https://photonics-calculators.vercel.app/spectroscopy/raman-shift',
  { category: 'Spectroscopy`,
  `Convert between Raman shift (cm⁻¹), scattered wavelength, and energy for any excitation laser.'
};


const jsonLd = generateCalculatorJsonLd(
  'Raman Shift Calculator',
  'Convert between Raman shift (cm⁻¹), scattered wavelength, and energy for any excitation laser.',
  'https://photonics-calculators.vercel.app/spectroscopy/raman-shift',
  { category: 'Spectroscopy`,
  `https://photonics-calculators.vercel.app/spectroscopy/raman-shift`,
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

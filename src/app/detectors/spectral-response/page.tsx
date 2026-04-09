import type { Metadata } from "next";
import { generateCalculatorJsonLd, JsonLdScript } from '../../../lib/json-ld';
import PageClient from "./page-client";

export const metadata: Metadata = {
    alternates: { canonical: 'https://photonics-calculators.vercel.app/detectors/spectral-response' },
      title: 'Spectral Response',
  description: 'R() = η() q / (hc). Responsivity and quantum efficiency as a function of wavelength.',
};
const jsonLd = generateCalculatorJsonLd(
  `Spectral Response',
  description: 'R() = η() q / (hc). Responsivity and quantum efficiency as a function of wavelength.',
};


const jsonLd = generateCalculatorJsonLd(
  'Spectral Response',
  'R() = η() q / (hc). Responsivity and quantum efficiency as a function of wavelength.',
  'https://photonics-calculators.vercel.app/detectors/spectral-response',
  { category: 'Detectors`,
  `R() = η() q / (hc). Responsivity and quantum efficiency as a function of wavelength.',
};


const jsonLd = generateCalculatorJsonLd(
  'Spectral Response',
  'R() = η() q / (hc). Responsivity and quantum efficiency as a function of wavelength.',
  'https://photonics-calculators.vercel.app/detectors/spectral-response',
  { category: 'Detectors`,
  `https://photonics-calculators.vercel.app/detectors/spectral-response`,
  { category: `Detectors` }
);
export default function Page() {
  return (
    <>
      <JsonLdScript data={jsonLd} />
      <PageClient />
    </>
  );
}

import type { Metadata } from "next";
import { generateCalculatorJsonLd, JsonLdScript } from '../../../lib/json-ld';
import PageClient from "./page-client";

export const metadata: Metadata = {
    alternates: { canonical: 'https://photonics-calculators.vercel.app/spectroscopy/fourier-self-comb' },
    title: 'Fourier Self-Comb Spectroscopy',
  description: 'Optical frequency comb from a single microresonator. Dual-comb spectroscopy without two separate lasers.'
};
const jsonLd = generateCalculatorJsonLd(
  `Fourier Self-Comb Spectroscopy',
  description: 'Optical frequency comb from a single microresonator. Dual-comb spectroscopy without two separate lasers.'
};


const jsonLd = generateCalculatorJsonLd(
  'Fourier Self-Comb Spectroscopy',
  'Optical frequency comb from a single microresonator. Dual-comb spectroscopy without two separate lasers.',
  'https://photonics-calculators.vercel.app/spectroscopy/fourier-self-comb',
  { category: 'Spectroscopy`,
  `Optical frequency comb from a single microresonator. Dual-comb spectroscopy without two separate lasers.'
};


const jsonLd = generateCalculatorJsonLd(
  'Fourier Self-Comb Spectroscopy',
  'Optical frequency comb from a single microresonator. Dual-comb spectroscopy without two separate lasers.',
  'https://photonics-calculators.vercel.app/spectroscopy/fourier-self-comb',
  { category: 'Spectroscopy`,
  `https://photonics-calculators.vercel.app/spectroscopy/fourier-self-comb`,
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

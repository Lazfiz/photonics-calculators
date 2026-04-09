import type { Metadata } from "next";
import { generateCalculatorJsonLd, JsonLdScript } from '../../../lib/json-ld';
import PageClient from "./page-client";

export const metadata: Metadata = {
    alternates: { canonical: 'https://photonics-calculators.vercel.app/spectroscopy/absorption-cross-section' },
      title: 'Absorption Cross-Section Calculator',
  description: '= 1000 / (N_A ln 10) — convert molar extinction coefficient to molecular cross-section.',
};
const jsonLd = generateCalculatorJsonLd(
  `Absorption Cross-Section Calculator',
  description: '= 1000 / (N_A ln 10) — convert molar extinction coefficient to molecular cross-section.',
};


const jsonLd = generateCalculatorJsonLd(
  'Absorption Cross-Section Calculator',
  '= 1000 / (N_A ln 10) — convert molar extinction coefficient to molecular cross-section.',
  'https://photonics-calculators.vercel.app/spectroscopy/absorption-cross-section',
  { category: 'Spectroscopy`,
  `= 1000 / (N_A ln 10) — convert molar extinction coefficient to molecular cross-section.',
};


const jsonLd = generateCalculatorJsonLd(
  'Absorption Cross-Section Calculator',
  '= 1000 / (N_A ln 10) — convert molar extinction coefficient to molecular cross-section.',
  'https://photonics-calculators.vercel.app/spectroscopy/absorption-cross-section',
  { category: 'Spectroscopy`,
  `https://photonics-calculators.vercel.app/spectroscopy/absorption-cross-section`,
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

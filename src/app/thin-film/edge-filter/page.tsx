import type { Metadata } from "next";
import { generateCalculatorJsonLd, JsonLdScript } from '../../../lib/json-ld';
import PageClient from "./page-client";

export const metadata: Metadata = {
    alternates: { canonical: 'https://photonics-calculators.vercel.app/thin-film/edge-filter' },
      title: 'Edge Filter Design',
  description: '{type === "long" ? "Long-pass" : "Short-pass"} edge filter — quarter-wave stack transition region and cut-on/cut-off wavelength.',
};
const jsonLd = generateCalculatorJsonLd(
  `Edge Filter Design',
  description: '{type === "long" ? "Long-pass" : "Short-pass"} edge filter — quarter-wave stack transition region and cut-on/cut-off wavelength.',
};


const jsonLd = generateCalculatorJsonLd(
  'Edge Filter Design',
  '{type === "long" ? "Long-pass" : "Short-pass"} edge filter — quarter-wave stack transition region and cut-on/cut-off wavelength.',
  'https://photonics-calculators.vercel.app/thin-film/edge-filter',
  { category: 'Thin Film`,
  `{type === "long" ? "Long-pass" : "Short-pass"} edge filter — quarter-wave stack transition region and cut-on/cut-off wavelength.',
};


const jsonLd = generateCalculatorJsonLd(
  'Edge Filter Design',
  '{type === "long" ? "Long-pass" : "Short-pass"} edge filter — quarter-wave stack transition region and cut-on/cut-off wavelength.',
  'https://photonics-calculators.vercel.app/thin-film/edge-filter',
  { category: 'Thin Film`,
  `https://photonics-calculators.vercel.app/thin-film/edge-filter`,
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

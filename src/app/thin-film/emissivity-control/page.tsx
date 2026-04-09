import type { Metadata } from "next";
import { generateCalculatorJsonLd, JsonLdScript } from '../../../lib/json-ld';
import PageClient from "./page-client";

export const metadata: Metadata = {
    alternates: { canonical: 'https://photonics-calculators.vercel.app/thin-film/emissivity-control' },
    title: 'Emissivity Control',
  description: 'Low-emissivity (Low-E) coating for thermal insulation — Kirchhoff',
};
const jsonLd = generateCalculatorJsonLd(
  `Emissivity Control',
  description: 'Low-emissivity (Low-E) coating for thermal insulation — Kirchhoff',
};


const jsonLd = generateCalculatorJsonLd(
  'Emissivity Control',
  'Low-emissivity (Low-E) coating for thermal insulation — Kirchhoff',
  'https://photonics-calculators.vercel.app/thin-film/emissivity-control',
  { category: 'Thin Film`,
  `Low-emissivity (Low-E) coating for thermal insulation — Kirchhoff',
};


const jsonLd = generateCalculatorJsonLd(
  'Emissivity Control',
  'Low-emissivity (Low-E) coating for thermal insulation — Kirchhoff',
  'https://photonics-calculators.vercel.app/thin-film/emissivity-control',
  { category: 'Thin Film`,
  `https://photonics-calculators.vercel.app/thin-film/emissivity-control`,
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

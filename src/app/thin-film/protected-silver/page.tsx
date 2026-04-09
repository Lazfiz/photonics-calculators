import type { Metadata } from "next";
import { generateCalculatorJsonLd, JsonLdScript } from '../../../lib/json-ld';
import PageClient from "./page-client";

export const metadata: Metadata = {
    alternates: { canonical: 'https://photonics-calculators.vercel.app/thin-film/protected-silver' },
    title: 'Protected Silver Mirror',
  description: 'Protected silver coating — high reflectance UV-Vis-IR with dielectric overcoat and adhesion layer.'
};
const jsonLd = generateCalculatorJsonLd(
  `Protected Silver Mirror',
  description: 'Protected silver coating — high reflectance UV-Vis-IR with dielectric overcoat and adhesion layer.'
};


const jsonLd = generateCalculatorJsonLd(
  'Protected Silver Mirror',
  'Protected silver coating — high reflectance UV-Vis-IR with dielectric overcoat and adhesion layer.',
  'https://photonics-calculators.vercel.app/thin-film/protected-silver',
  { category: 'Thin Film`,
  `Protected silver coating — high reflectance UV-Vis-IR with dielectric overcoat and adhesion layer.'
};


const jsonLd = generateCalculatorJsonLd(
  'Protected Silver Mirror',
  'Protected silver coating — high reflectance UV-Vis-IR with dielectric overcoat and adhesion layer.',
  'https://photonics-calculators.vercel.app/thin-film/protected-silver',
  { category: 'Thin Film`,
  `https://photonics-calculators.vercel.app/thin-film/protected-silver`,
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

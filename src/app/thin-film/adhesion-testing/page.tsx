import type { Metadata } from "next";
import { generateCalculatorJsonLd, JsonLdScript } from '../../../lib/json-ld';
import PageClient from "./page-client";

export const metadata: Metadata = {
    alternates: { canonical: 'https://photonics-calculators.vercel.app/thin-film/adhesion-testing' },
    title: 'Adhesion Testing',
  description: 'Model thin film adhesion properties from scratch test, peel test, tape test, and bend test. Calculate adhesion energy, interfacial shear strength, and critical loads.'
};
const jsonLd = generateCalculatorJsonLd(
  `Adhesion Testing',
  description: 'Model thin film adhesion properties from scratch test, peel test, tape test, and bend test. Calculate adhesion energy, interfacial shear strength, and critical loads.'
};


const jsonLd = generateCalculatorJsonLd(
  'Adhesion Testing',
  'Model thin film adhesion properties from scratch test, peel test, tape test, and bend test. Calculate adhesion energy, interfacial shear strength, and critical loads.',
  'https://photonics-calculators.vercel.app/thin-film/adhesion-testing',
  { category: 'Thin Film`,
  `Model thin film adhesion properties from scratch test, peel test, tape test, and bend test. Calculate adhesion energy, interfacial shear strength, and critical loads.'
};


const jsonLd = generateCalculatorJsonLd(
  'Adhesion Testing',
  'Model thin film adhesion properties from scratch test, peel test, tape test, and bend test. Calculate adhesion energy, interfacial shear strength, and critical loads.',
  'https://photonics-calculators.vercel.app/thin-film/adhesion-testing',
  { category: 'Thin Film`,
  `https://photonics-calculators.vercel.app/thin-film/adhesion-testing`,
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

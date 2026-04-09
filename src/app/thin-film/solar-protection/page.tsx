import type { Metadata } from "next";
import { generateCalculatorJsonLd, JsonLdScript } from '../../../lib/json-ld';
import PageClient from "./page-client";

export const metadata: Metadata = {
    alternates: { canonical: 'https://photonics-calculators.vercel.app/thin-film/solar-protection' },
    title: 'Solar Protection Coating',
  description: 'Dual-stack design: UV + IR blocking for glazing and solar control applications.'
};
const jsonLd = generateCalculatorJsonLd(
  `Solar Protection Coating',
  description: 'Dual-stack design: UV + IR blocking for glazing and solar control applications.'
};


const jsonLd = generateCalculatorJsonLd(
  'Solar Protection Coating',
  'Dual-stack design: UV + IR blocking for glazing and solar control applications.',
  'https://photonics-calculators.vercel.app/thin-film/solar-protection',
  { category: 'Thin Film`,
  `Dual-stack design: UV + IR blocking for glazing and solar control applications.'
};


const jsonLd = generateCalculatorJsonLd(
  'Solar Protection Coating',
  'Dual-stack design: UV + IR blocking for glazing and solar control applications.',
  'https://photonics-calculators.vercel.app/thin-film/solar-protection',
  { category: 'Thin Film`,
  `https://photonics-calculators.vercel.app/thin-film/solar-protection`,
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

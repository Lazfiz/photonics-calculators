import type { Metadata } from "next";
import { generateCalculatorJsonLd, JsonLdScript } from '../../../lib/json-ld';
import PageClient from "./page-client";

export const metadata: Metadata = {
    alternates: { canonical: 'https://photonics-calculators.vercel.app/imaging/optical-power' },
    title: 'Optical Power (Diopters)',
  description: 'Convert between focal length and optical power, with an eye model reference.'
};
const jsonLd = generateCalculatorJsonLd(
  `Optical Power (Diopters)',
  description: 'Convert between focal length and optical power, with an eye model reference.'
};


const jsonLd = generateCalculatorJsonLd(
  'Optical Power (Diopters)',
  'Convert between focal length and optical power, with an eye model reference.',
  'https://photonics-calculators.vercel.app/imaging/optical-power',
  { category: 'Imaging`,
  `Convert between focal length and optical power, with an eye model reference.'
};


const jsonLd = generateCalculatorJsonLd(
  'Optical Power (Diopters)',
  'Convert between focal length and optical power, with an eye model reference.',
  'https://photonics-calculators.vercel.app/imaging/optical-power',
  { category: 'Imaging`,
  `https://photonics-calculators.vercel.app/imaging/optical-power`,
  { category: `Imaging` }
);
export default function Page() {
  return (
    <>
      <JsonLdScript data={jsonLd} />
      <PageClient />
    </>
  );
}

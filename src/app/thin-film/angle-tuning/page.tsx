import type { Metadata } from "next";
import { generateCalculatorJsonLd, JsonLdScript } from '../../../lib/json-ld';
import PageClient from "./page-client";

export const metadata: Metadata = {
    alternates: { canonical: 'https://photonics-calculators.vercel.app/thin-film/angle-tuning' },
      title: 'Angle Tuning of Coatings',
  description: 'Changing the angle of incidence shifts the spectral response of thin film coatings toward',
};
const jsonLd = generateCalculatorJsonLd(
  `Angle Tuning of Coatings',
  description: 'Changing the angle of incidence shifts the spectral response of thin film coatings toward',
};


const jsonLd = generateCalculatorJsonLd(
  'Angle Tuning of Coatings',
  'Changing the angle of incidence shifts the spectral response of thin film coatings toward',
  'https://photonics-calculators.vercel.app/thin-film/angle-tuning',
  { category: 'Thin Film`,
  `Changing the angle of incidence shifts the spectral response of thin film coatings toward',
};


const jsonLd = generateCalculatorJsonLd(
  'Angle Tuning of Coatings',
  'Changing the angle of incidence shifts the spectral response of thin film coatings toward',
  'https://photonics-calculators.vercel.app/thin-film/angle-tuning',
  { category: 'Thin Film`,
  `https://photonics-calculators.vercel.app/thin-film/angle-tuning`,
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

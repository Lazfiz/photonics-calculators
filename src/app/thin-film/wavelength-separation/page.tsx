import type { Metadata } from "next";
import { generateCalculatorJsonLd, JsonLdScript } from '../../../lib/json-ld';
import PageClient from "./page-client";

export const metadata: Metadata = {
    alternates: { canonical: 'https://photonics-calculators.vercel.app/thin-film/wavelength-separation' },
      title: 'Wavelength Separation',
  description: 'Wavelength separation coatings combine multiple quarter-wave stacks at different design wavelengths',
};
const jsonLd = generateCalculatorJsonLd(
  `Wavelength Separation',
  description: 'Wavelength separation coatings combine multiple quarter-wave stacks at different design wavelengths',
};


const jsonLd = generateCalculatorJsonLd(
  'Wavelength Separation',
  'Wavelength separation coatings combine multiple quarter-wave stacks at different design wavelengths',
  'https://photonics-calculators.vercel.app/thin-film/wavelength-separation',
  { category: 'Thin Film`,
  `Wavelength separation coatings combine multiple quarter-wave stacks at different design wavelengths',
};


const jsonLd = generateCalculatorJsonLd(
  'Wavelength Separation',
  'Wavelength separation coatings combine multiple quarter-wave stacks at different design wavelengths',
  'https://photonics-calculators.vercel.app/thin-film/wavelength-separation',
  { category: 'Thin Film`,
  `https://photonics-calculators.vercel.app/thin-film/wavelength-separation`,
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

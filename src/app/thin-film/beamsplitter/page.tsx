import type { Metadata } from "next";
import { generateCalculatorJsonLd, JsonLdScript } from '../../../lib/json-ld';
import PageClient from "./page-client";

export const metadata: Metadata = {
    alternates: { canonical: 'https://photonics-calculators.vercel.app/thin-film/beamsplitter' },
      title: 'Beamsplitter Design',
  description: 'Dielectric beamsplitters split light into reflected and transmitted beams. A single quarter-wave',
};
const jsonLd = generateCalculatorJsonLd(
  `Beamsplitter Design',
  description: 'Dielectric beamsplitters split light into reflected and transmitted beams. A single quarter-wave',
};


const jsonLd = generateCalculatorJsonLd(
  'Beamsplitter Design',
  'Dielectric beamsplitters split light into reflected and transmitted beams. A single quarter-wave',
  'https://photonics-calculators.vercel.app/thin-film/beamsplitter',
  { category: 'Thin Film`,
  `Dielectric beamsplitters split light into reflected and transmitted beams. A single quarter-wave',
};


const jsonLd = generateCalculatorJsonLd(
  'Beamsplitter Design',
  'Dielectric beamsplitters split light into reflected and transmitted beams. A single quarter-wave',
  'https://photonics-calculators.vercel.app/thin-film/beamsplitter',
  { category: 'Thin Film`,
  `https://photonics-calculators.vercel.app/thin-film/beamsplitter`,
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

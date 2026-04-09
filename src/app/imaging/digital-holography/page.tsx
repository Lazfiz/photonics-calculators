import type { Metadata } from "next";
import { generateCalculatorJsonLd, JsonLdScript } from '../../../lib/json-ld';
import PageClient from "./page-client";

export const metadata: Metadata = {
    alternates: { canonical: 'https://photonics-calculators.vercel.app/imaging/digital-holography' },
    title: 'Digital Holography',
  description: 'Hologram recording, numerical reconstruction, resolution limits, and sampling criteria.'
};
const jsonLd = generateCalculatorJsonLd(
  `Digital Holography',
  description: 'Hologram recording, numerical reconstruction, resolution limits, and sampling criteria.'
};


const jsonLd = generateCalculatorJsonLd(
  'Digital Holography',
  'Hologram recording, numerical reconstruction, resolution limits, and sampling criteria.',
  'https://photonics-calculators.vercel.app/imaging/digital-holography',
  { category: 'Imaging`,
  `Hologram recording, numerical reconstruction, resolution limits, and sampling criteria.'
};


const jsonLd = generateCalculatorJsonLd(
  'Digital Holography',
  'Hologram recording, numerical reconstruction, resolution limits, and sampling criteria.',
  'https://photonics-calculators.vercel.app/imaging/digital-holography',
  { category: 'Imaging`,
  `https://photonics-calculators.vercel.app/imaging/digital-holography`,
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

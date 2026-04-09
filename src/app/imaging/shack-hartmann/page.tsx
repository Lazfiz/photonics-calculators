import type { Metadata } from "next";
import { generateCalculatorJsonLd, JsonLdScript } from '../../../lib/json-ld';
import PageClient from "./page-client";

export const metadata: Metadata = {
    alternates: { canonical: 'https://photonics-calculators.vercel.app/imaging/shack-hartmann' },
    title: 'Shack-Hartmann Sensor',
  description: 'SHWFS design: spot size, centroid precision, sensitivity, dynamic range, and sub-aperture layout.'
};
const jsonLd = generateCalculatorJsonLd(
  `Shack-Hartmann Sensor',
  description: 'SHWFS design: spot size, centroid precision, sensitivity, dynamic range, and sub-aperture layout.'
};


const jsonLd = generateCalculatorJsonLd(
  'Shack-Hartmann Sensor',
  'SHWFS design: spot size, centroid precision, sensitivity, dynamic range, and sub-aperture layout.',
  'https://photonics-calculators.vercel.app/imaging/shack-hartmann',
  { category: 'Imaging`,
  `SHWFS design: spot size, centroid precision, sensitivity, dynamic range, and sub-aperture layout.'
};


const jsonLd = generateCalculatorJsonLd(
  'Shack-Hartmann Sensor',
  'SHWFS design: spot size, centroid precision, sensitivity, dynamic range, and sub-aperture layout.',
  'https://photonics-calculators.vercel.app/imaging/shack-hartmann',
  { category: 'Imaging`,
  `https://photonics-calculators.vercel.app/imaging/shack-hartmann`,
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

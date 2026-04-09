import type { Metadata } from "next";
import { generateCalculatorJsonLd, JsonLdScript } from '../../../lib/json-ld';
import PageClient from "./page-client";

export const metadata: Metadata = {
    alternates: { canonical: 'https://photonics-calculators.vercel.app/laser-safety/optical-density' },
    title: 'Optical Density (CW point-source pre-check)',
  description: 'Bounded CW point-source optical-density pre-check derived from the same MPE branch as the MPE page.'
};
const jsonLd = generateCalculatorJsonLd(
  `Optical Density (CW point-source pre-check)',
  description: 'Bounded CW point-source optical-density pre-check derived from the same MPE branch as the MPE page.'
};


const jsonLd = generateCalculatorJsonLd(
  'Optical Density (CW point-source pre-check)',
  'Bounded CW point-source optical-density pre-check derived from the same MPE branch as the MPE page.',
  'https://photonics-calculators.vercel.app/laser-safety/optical-density',
  { category: 'Laser Safety`,
  `Bounded CW point-source optical-density pre-check derived from the same MPE branch as the MPE page.'
};


const jsonLd = generateCalculatorJsonLd(
  'Optical Density (CW point-source pre-check)',
  'Bounded CW point-source optical-density pre-check derived from the same MPE branch as the MPE page.',
  'https://photonics-calculators.vercel.app/laser-safety/optical-density',
  { category: 'Laser Safety`,
  `https://photonics-calculators.vercel.app/laser-safety/optical-density`,
  { category: `Laser Safety` }
);
export default function Page() {
  return (
    <>
      <JsonLdScript data={jsonLd} />
      <PageClient />
    </>
  );
}

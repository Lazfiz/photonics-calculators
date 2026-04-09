import type { Metadata } from "next";
import { generateCalculatorJsonLd, JsonLdScript } from '../../../lib/json-ld';
import PageClient from "./page-client";

export const metadata: Metadata = {
    alternates: { canonical: 'https://photonics-calculators.vercel.app/laser-safety/retinal-image-size' },
    title: 'Retinal Image Size',
  description: 'Calculates retinal spot size from corneal beam parameters, including diffraction and geometric contributions per ANSI Z136.1.'
};
const jsonLd = generateCalculatorJsonLd(
  `Retinal Image Size',
  description: 'Calculates retinal spot size from corneal beam parameters, including diffraction and geometric contributions per ANSI Z136.1.'
};


const jsonLd = generateCalculatorJsonLd(
  'Retinal Image Size',
  'Calculates retinal spot size from corneal beam parameters, including diffraction and geometric contributions per ANSI Z136.1.',
  'https://photonics-calculators.vercel.app/laser-safety/retinal-image-size',
  { category: 'Laser Safety`,
  `Calculates retinal spot size from corneal beam parameters, including diffraction and geometric contributions per ANSI Z136.1.'
};


const jsonLd = generateCalculatorJsonLd(
  'Retinal Image Size',
  'Calculates retinal spot size from corneal beam parameters, including diffraction and geometric contributions per ANSI Z136.1.',
  'https://photonics-calculators.vercel.app/laser-safety/retinal-image-size',
  { category: 'Laser Safety`,
  `https://photonics-calculators.vercel.app/laser-safety/retinal-image-size`,
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

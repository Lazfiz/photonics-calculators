import type { Metadata } from "next";
import { generateCalculatorJsonLd, JsonLdScript } from '../../../lib/json-ld';
import PageClient from "./page-client";

export const metadata: Metadata = {
    alternates: { canonical: 'https://photonics-calculators.vercel.app/imaging/confocal-resolution' },
    title: 'Confocal Resolution Calculator',
  description: 'Compare lateral and axial resolution between widefield and confocal microscopy with adjustable pinhole size.'
};
const jsonLd = generateCalculatorJsonLd(
  `Confocal Resolution Calculator',
  description: 'Compare lateral and axial resolution between widefield and confocal microscopy with adjustable pinhole size.'
};


const jsonLd = generateCalculatorJsonLd(
  'Confocal Resolution Calculator',
  'Compare lateral and axial resolution between widefield and confocal microscopy with adjustable pinhole size.',
  'https://photonics-calculators.vercel.app/imaging/confocal-resolution',
  { category: 'Imaging`,
  `Compare lateral and axial resolution between widefield and confocal microscopy with adjustable pinhole size.'
};


const jsonLd = generateCalculatorJsonLd(
  'Confocal Resolution Calculator',
  'Compare lateral and axial resolution between widefield and confocal microscopy with adjustable pinhole size.',
  'https://photonics-calculators.vercel.app/imaging/confocal-resolution',
  { category: 'Imaging`,
  `https://photonics-calculators.vercel.app/imaging/confocal-resolution`,
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

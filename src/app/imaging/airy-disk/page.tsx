import type { Metadata } from "next";
import { generateCalculatorJsonLd, JsonLdScript } from '../../../lib/json-ld';
import PageClient from "./page-client";

export const metadata: Metadata = {
    alternates: { canonical: 'https://photonics-calculators.vercel.app/imaging/airy-disk' },
    title: 'Airy Disk Size Calculator',
  description: 'Calculate the Airy disk radius and Abbe diffraction limit from wavelength and numerical aperture.'
};
const jsonLd = generateCalculatorJsonLd(
  `Airy Disk Size Calculator',
  description: 'Calculate the Airy disk radius and Abbe diffraction limit from wavelength and numerical aperture.'
};


const jsonLd = generateCalculatorJsonLd(
  'Airy Disk Size Calculator',
  'Calculate the Airy disk radius and Abbe diffraction limit from wavelength and numerical aperture.',
  'https://photonics-calculators.vercel.app/imaging/airy-disk',
  { category: 'Imaging`,
  `Calculate the Airy disk radius and Abbe diffraction limit from wavelength and numerical aperture.'
};


const jsonLd = generateCalculatorJsonLd(
  'Airy Disk Size Calculator',
  'Calculate the Airy disk radius and Abbe diffraction limit from wavelength and numerical aperture.',
  'https://photonics-calculators.vercel.app/imaging/airy-disk',
  { category: 'Imaging`,
  `https://photonics-calculators.vercel.app/imaging/airy-disk`,
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

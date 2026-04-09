import type { Metadata } from "next";
import { generateCalculatorJsonLd, JsonLdScript } from '../../../lib/json-ld';
import PageClient from "./page-client";

export const metadata: Metadata = {
    alternates: { canonical: 'https://photonics-calculators.vercel.app/wave-optics/filamentation' },
    title: 'Filamentation Dynamics',
  description: 'Laser filamentation — balance of Kerr self-focusing, plasma defocusing, and diffraction.'
};
const jsonLd = generateCalculatorJsonLd(
  `Filamentation Dynamics',
  description: 'Laser filamentation — balance of Kerr self-focusing, plasma defocusing, and diffraction.'
};


const jsonLd = generateCalculatorJsonLd(
  'Filamentation Dynamics',
  'Laser filamentation — balance of Kerr self-focusing, plasma defocusing, and diffraction.',
  'https://photonics-calculators.vercel.app/wave-optics/filamentation',
  { category: 'Wave Optics`,
  `Laser filamentation — balance of Kerr self-focusing, plasma defocusing, and diffraction.'
};


const jsonLd = generateCalculatorJsonLd(
  'Filamentation Dynamics',
  'Laser filamentation — balance of Kerr self-focusing, plasma defocusing, and diffraction.',
  'https://photonics-calculators.vercel.app/wave-optics/filamentation',
  { category: 'Wave Optics`,
  `https://photonics-calculators.vercel.app/wave-optics/filamentation`,
  { category: `Wave Optics` }
);
export default function Page() {
  return (
    <>
      <JsonLdScript data={jsonLd} />
      <PageClient />
    </>
  );
}

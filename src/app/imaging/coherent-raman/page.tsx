import type { Metadata } from "next";
import { generateCalculatorJsonLd, JsonLdScript } from '../../../lib/json-ld';
import PageClient from "./page-client";

export const metadata: Metadata = {
    alternates: { canonical: 'https://photonics-calculators.vercel.app/imaging/coherent-raman' },
    title: 'Coherent Raman (CARS/SRS) Calculator',
  description: 'Coherent Anti-Stokes Raman Scattering and Stimulated Raman Scattering signal estimation.'
};
const jsonLd = generateCalculatorJsonLd(
  `Coherent Raman (CARS/SRS) Calculator',
  description: 'Coherent Anti-Stokes Raman Scattering and Stimulated Raman Scattering signal estimation.'
};


const jsonLd = generateCalculatorJsonLd(
  'Coherent Raman (CARS/SRS) Calculator',
  'Coherent Anti-Stokes Raman Scattering and Stimulated Raman Scattering signal estimation.',
  'https://photonics-calculators.vercel.app/imaging/coherent-raman',
  { category: 'Imaging`,
  `Coherent Anti-Stokes Raman Scattering and Stimulated Raman Scattering signal estimation.'
};


const jsonLd = generateCalculatorJsonLd(
  'Coherent Raman (CARS/SRS) Calculator',
  'Coherent Anti-Stokes Raman Scattering and Stimulated Raman Scattering signal estimation.',
  'https://photonics-calculators.vercel.app/imaging/coherent-raman',
  { category: 'Imaging`,
  `https://photonics-calculators.vercel.app/imaging/coherent-raman`,
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

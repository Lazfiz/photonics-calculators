import type { Metadata } from "next";
import { generateCalculatorJsonLd, JsonLdScript } from '../../../lib/json-ld';
import PageClient from "./page-client";

export const metadata: Metadata = {
    alternates: { canonical: 'https://photonics-calculators.vercel.app/materials/brillouin-scattering' },
    title: 'Brillouin Scattering',
  description: 'Stimulated Brillouin scattering (SBS): frequency shift, gain coefficient, and power threshold in optical fibers and bulk materials.'
};
const jsonLd = generateCalculatorJsonLd(
  `Brillouin Scattering',
  description: 'Stimulated Brillouin scattering (SBS): frequency shift, gain coefficient, and power threshold in optical fibers and bulk materials.'
};


const jsonLd = generateCalculatorJsonLd(
  'Brillouin Scattering',
  'Stimulated Brillouin scattering (SBS): frequency shift, gain coefficient, and power threshold in optical fibers and bulk materials.',
  'https://photonics-calculators.vercel.app/materials/brillouin-scattering',
  { category: 'Materials`,
  `Stimulated Brillouin scattering (SBS): frequency shift, gain coefficient, and power threshold in optical fibers and bulk materials.'
};


const jsonLd = generateCalculatorJsonLd(
  'Brillouin Scattering',
  'Stimulated Brillouin scattering (SBS): frequency shift, gain coefficient, and power threshold in optical fibers and bulk materials.',
  'https://photonics-calculators.vercel.app/materials/brillouin-scattering',
  { category: 'Materials`,
  `https://photonics-calculators.vercel.app/materials/brillouin-scattering`,
  { category: `Materials` }
);
export default function Page() {
  return (
    <>
      <JsonLdScript data={jsonLd} />
      <PageClient />
    </>
  );
}

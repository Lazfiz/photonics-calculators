import type { Metadata } from "next";
import { generateCalculatorJsonLd, JsonLdScript } from '../../../lib/json-ld';
import PageClient from "./page-client";

export const metadata: Metadata = {
    alternates: { canonical: 'https://photonics-calculators.vercel.app/wave-optics/gires-tournois' },
    title: 'Gires-Tournois Interferometer',
  description: 'Dispersion control via a GTI — constant reflectivity with tunable group delay dispersion.'
};
const jsonLd = generateCalculatorJsonLd(
  `Gires-Tournois Interferometer',
  description: 'Dispersion control via a GTI — constant reflectivity with tunable group delay dispersion.'
};


const jsonLd = generateCalculatorJsonLd(
  'Gires-Tournois Interferometer',
  'Dispersion control via a GTI — constant reflectivity with tunable group delay dispersion.',
  'https://photonics-calculators.vercel.app/wave-optics/gires-tournois',
  { category: 'Wave Optics`,
  `Dispersion control via a GTI — constant reflectivity with tunable group delay dispersion.'
};


const jsonLd = generateCalculatorJsonLd(
  'Gires-Tournois Interferometer',
  'Dispersion control via a GTI — constant reflectivity with tunable group delay dispersion.',
  'https://photonics-calculators.vercel.app/wave-optics/gires-tournois',
  { category: 'Wave Optics`,
  `https://photonics-calculators.vercel.app/wave-optics/gires-tournois`,
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

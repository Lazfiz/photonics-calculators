import type { Metadata } from "next";
import { generateCalculatorJsonLd, JsonLdScript } from '../../../lib/json-ld';
import PageClient from "./page-client";

export const metadata: Metadata = {
    alternates: { canonical: 'https://photonics-calculators.vercel.app/thin-film/fabry-perot-filter' },
    title: 'Fabry-Pérot Filter',
  description: 'Fabry-Pérot etalon/filter transmission based on the Airy function. Explore how mirror reflectance and cavity spacing control spectral selectivity.'
};
const jsonLd = generateCalculatorJsonLd(
  `Fabry-Pérot Filter',
  description: 'Fabry-Pérot etalon/filter transmission based on the Airy function. Explore how mirror reflectance and cavity spacing control spectral selectivity.'
};


const jsonLd = generateCalculatorJsonLd(
  'Fabry-Pérot Filter',
  'Fabry-Pérot etalon/filter transmission based on the Airy function. Explore how mirror reflectance and cavity spacing control spectral selectivity.',
  'https://photonics-calculators.vercel.app/thin-film/fabry-perot-filter',
  { category: 'Thin Film`,
  `Fabry-Pérot etalon/filter transmission based on the Airy function. Explore how mirror reflectance and cavity spacing control spectral selectivity.'
};


const jsonLd = generateCalculatorJsonLd(
  'Fabry-Pérot Filter',
  'Fabry-Pérot etalon/filter transmission based on the Airy function. Explore how mirror reflectance and cavity spacing control spectral selectivity.',
  'https://photonics-calculators.vercel.app/thin-film/fabry-perot-filter',
  { category: 'Thin Film`,
  `https://photonics-calculators.vercel.app/thin-film/fabry-perot-filter`,
  { category: `Thin Film` }
);
export default function Page() {
  return (
    <>
      <JsonLdScript data={jsonLd} />
      <PageClient />
    </>
  );
}

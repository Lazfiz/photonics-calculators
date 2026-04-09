import type { Metadata } from "next";
import { generateCalculatorJsonLd, JsonLdScript } from '../../../lib/json-ld';
import PageClient from "./page-client";

export const metadata: Metadata = {
    alternates: { canonical: 'https://photonics-calculators.vercel.app/thin-film/anti-fog' },
    title: 'Anti-Fog Coating Design',
  description: 'Hydrophilic thin film that spreads condensation into a uniform water layer, minimizing scattering.'
};
const jsonLd = generateCalculatorJsonLd(
  `Anti-Fog Coating Design',
  description: 'Hydrophilic thin film that spreads condensation into a uniform water layer, minimizing scattering.'
};


const jsonLd = generateCalculatorJsonLd(
  'Anti-Fog Coating Design',
  'Hydrophilic thin film that spreads condensation into a uniform water layer, minimizing scattering.',
  'https://photonics-calculators.vercel.app/thin-film/anti-fog',
  { category: 'Thin Film`,
  `Hydrophilic thin film that spreads condensation into a uniform water layer, minimizing scattering.'
};


const jsonLd = generateCalculatorJsonLd(
  'Anti-Fog Coating Design',
  'Hydrophilic thin film that spreads condensation into a uniform water layer, minimizing scattering.',
  'https://photonics-calculators.vercel.app/thin-film/anti-fog',
  { category: 'Thin Film`,
  `https://photonics-calculators.vercel.app/thin-film/anti-fog`,
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

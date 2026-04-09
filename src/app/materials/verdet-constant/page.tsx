import type { Metadata } from "next";
import { generateCalculatorJsonLd, JsonLdScript } from '../../../lib/json-ld';
import PageClient from "./page-client";

export const metadata: Metadata = {
    alternates: { canonical: 'https://photonics-calculators.vercel.app/materials/verdet-constant' },
      title: 'Verdet Constant',
  description: 'Faraday rotation: = V B L, where V ∝ 1/² for paramagnetic materials',
};
const jsonLd = generateCalculatorJsonLd(
  `Verdet Constant',
  description: 'Faraday rotation: = V B L, where V ∝ 1/² for paramagnetic materials',
};


const jsonLd = generateCalculatorJsonLd(
  'Verdet Constant',
  'Faraday rotation: = V B L, where V ∝ 1/² for paramagnetic materials',
  'https://photonics-calculators.vercel.app/materials/verdet-constant',
  { category: 'Materials`,
  `Faraday rotation: = V B L, where V ∝ 1/² for paramagnetic materials',
};


const jsonLd = generateCalculatorJsonLd(
  'Verdet Constant',
  'Faraday rotation: = V B L, where V ∝ 1/² for paramagnetic materials',
  'https://photonics-calculators.vercel.app/materials/verdet-constant',
  { category: 'Materials`,
  `https://photonics-calculators.vercel.app/materials/verdet-constant`,
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

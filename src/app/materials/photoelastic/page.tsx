import type { Metadata } from "next";
import { generateCalculatorJsonLd, JsonLdScript } from '../../../lib/json-ld';
import PageClient from "./page-client";

export const metadata: Metadata = {
    alternates: { canonical: 'https://photonics-calculators.vercel.app/materials/photoelastic' },
      title: 'Photoelastic Constants',
  description: 'Stress-induced birefringence: n = C , where C is the stress-optic coefficient',
};
const jsonLd = generateCalculatorJsonLd(
  `Photoelastic Constants',
  description: 'Stress-induced birefringence: n = C , where C is the stress-optic coefficient',
};


const jsonLd = generateCalculatorJsonLd(
  'Photoelastic Constants',
  'Stress-induced birefringence: n = C , where C is the stress-optic coefficient',
  'https://photonics-calculators.vercel.app/materials/photoelastic',
  { category: 'Materials`,
  `Stress-induced birefringence: n = C , where C is the stress-optic coefficient',
};


const jsonLd = generateCalculatorJsonLd(
  'Photoelastic Constants',
  'Stress-induced birefringence: n = C , where C is the stress-optic coefficient',
  'https://photonics-calculators.vercel.app/materials/photoelastic',
  { category: 'Materials`,
  `https://photonics-calculators.vercel.app/materials/photoelastic`,
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

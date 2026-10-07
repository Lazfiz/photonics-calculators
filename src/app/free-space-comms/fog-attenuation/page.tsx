import type { Metadata } from "next";
import { generateCalculatorJsonLd, JsonLdScript } from '../../../lib/json-ld';
import PageClient from "./page-client";

export const metadata: Metadata = {
    alternates: { canonical: 'https://photonics-calculators.vercel.app/free-space-comms/fog-attenuation' },
    title: 'Fog Attenuation',
  description: 'Optical attenuation in fog from visibility with the Kim or Kruse model: exponent q, attenuation coefficient, total path loss and transmitted fraction.'
};

const jsonLd = generateCalculatorJsonLd(
  'Fog Attenuation',
  'Optical attenuation in fog from visibility with the Kim or Kruse model: exponent q, attenuation coefficient, total path loss and transmitted fraction.',
  'https://photonics-calculators.vercel.app/free-space-comms/fog-attenuation',
  { category: 'Free Space Comms' }
);

export default function Page() {
  return (
    <>
      <JsonLdScript data={jsonLd} />
      <PageClient />
    </>
  );
}

import type { Metadata } from "next";
import { generateCalculatorJsonLd, JsonLdScript } from '../../../lib/json-ld';
import PageClient from "./page-client";

export const metadata: Metadata = {
    alternates: { canonical: 'https://photonics-calculators.vercel.app/free-space-comms/rain-attenuation' },
    title: 'Rain Attenuation',
  description: 'Specific and total attenuation of a free-space optical link in rain from the rain rate with the power law α = k·Rᵃ, for a given range.'
};

const jsonLd = generateCalculatorJsonLd(
  'Rain Attenuation',
  'Specific and total attenuation of a free-space optical link in rain from the rain rate with the power law α = k·Rᵃ, for a given range.',
  'https://photonics-calculators.vercel.app/free-space-comms/rain-attenuation',
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

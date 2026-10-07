import type { Metadata } from "next";
import { generateCalculatorJsonLd, JsonLdScript } from '../../../lib/json-ld';
import PageClient from "./page-client";

export const metadata: Metadata = {
    alternates: { canonical: 'https://photonics-calculators.vercel.app/free-space-comms/snow-attenuation' },
    title: 'Snow Attenuation',
  description: 'Specific and total attenuation of a free-space optical link in dry or wet snow from the snowfall rate (water equivalent), with equivalent visibility.'
};

const jsonLd = generateCalculatorJsonLd(
  'Snow Attenuation',
  'Specific and total attenuation of a free-space optical link in dry or wet snow from the snowfall rate (water equivalent), with equivalent visibility.',
  'https://photonics-calculators.vercel.app/free-space-comms/snow-attenuation',
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

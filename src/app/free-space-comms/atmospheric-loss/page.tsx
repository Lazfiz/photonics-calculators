import type { Metadata } from "next";
import { generateCalculatorJsonLd, JsonLdScript } from '../../../lib/json-ld';
import PageClient from "./page-client";

export const metadata: Metadata = {
    alternates: { canonical: 'https://photonics-calculators.vercel.app/free-space-comms/atmospheric-loss' },
    title: 'FSO Atmospheric Loss',
  description: 'Visibility-based (Kim) scattering plus water-vapour absorption: attenuation in dB/km, total path loss and transmittance of a free-space optical link.'
};

const jsonLd = generateCalculatorJsonLd(
  'FSO Atmospheric Loss',
  'Visibility-based (Kim) scattering plus water-vapour absorption: attenuation in dB/km, total path loss and transmittance of a free-space optical link.',
  'https://photonics-calculators.vercel.app/free-space-comms/atmospheric-loss',
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

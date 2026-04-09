import type { Metadata } from "next";
import { generateCalculatorJsonLd, JsonLdScript } from '../../../lib/json-ld';
import PageClient from "./page-client";

export const metadata: Metadata = {
    alternates: { canonical: 'https://photonics-calculators.vercel.app/free-space-comms/receiver-fov' },
    title: 'Receiver FOV vs Background Noise',
  description: 'Analyze receiver field of view trade-offs against background radiation noise.'
};
const jsonLd = generateCalculatorJsonLd(
  `Receiver FOV vs Background Noise',
  description: 'Analyze receiver field of view trade-offs against background radiation noise.'
};


const jsonLd = generateCalculatorJsonLd(
  'Receiver FOV vs Background Noise',
  'Analyze receiver field of view trade-offs against background radiation noise.',
  'https://photonics-calculators.vercel.app/free-space-comms/receiver-fov',
  { category: 'Free Space Comms`,
  `Analyze receiver field of view trade-offs against background radiation noise.'
};


const jsonLd = generateCalculatorJsonLd(
  'Receiver FOV vs Background Noise',
  'Analyze receiver field of view trade-offs against background radiation noise.',
  'https://photonics-calculators.vercel.app/free-space-comms/receiver-fov',
  { category: 'Free Space Comms`,
  `https://photonics-calculators.vercel.app/free-space-comms/receiver-fov`,
  { category: `Free Space Comms` }
);
export default function Page() {
  return (
    <>
      <JsonLdScript data={jsonLd} />
      <PageClient />
    </>
  );
}

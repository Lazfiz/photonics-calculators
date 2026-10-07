import type { Metadata } from "next";
import { generateCalculatorJsonLd, JsonLdScript } from '../../../lib/json-ld';
import PageClient from "./page-client";

export const metadata: Metadata = {
    alternates: { canonical: 'https://photonics-calculators.vercel.app/free-space-comms/point-ahead' },
    title: 'Point-Ahead Angle',
  description: 'Point-ahead angle from relative velocity, transmit beamwidth, time of flight and required pointing accuracy for LEO, GEO and deep-space laser links.'
};

const jsonLd = generateCalculatorJsonLd(
  'Point-Ahead Angle',
  'Point-ahead angle from relative velocity, transmit beamwidth, time of flight and required pointing accuracy for LEO, GEO and deep-space laser links.',
  'https://photonics-calculators.vercel.app/free-space-comms/point-ahead',
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

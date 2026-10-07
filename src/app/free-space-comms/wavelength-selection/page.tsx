import type { Metadata } from "next";
import { generateCalculatorJsonLd, JsonLdScript } from '../../../lib/json-ld';
import PageClient from "./page-client";

export const metadata: Metadata = {
    alternates: { canonical: 'https://photonics-calculators.vercel.app/free-space-comms/wavelength-selection' },
    title: 'FSO Wavelength Selection',
  description: 'Compare 850, 1064, 1310 and 1550 nm for an FSO link by eye safety, atmospheric loss, range and data rate, and get a recommended wavelength.'
};

const jsonLd = generateCalculatorJsonLd(
  'FSO Wavelength Selection',
  'Compare 850, 1064, 1310 and 1550 nm for an FSO link by eye safety, atmospheric loss, range and data rate, and get a recommended wavelength.',
  'https://photonics-calculators.vercel.app/free-space-comms/wavelength-selection',
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

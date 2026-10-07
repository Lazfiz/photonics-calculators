import type { Metadata } from "next";
import { generateCalculatorJsonLd, JsonLdScript } from '../../../lib/json-ld';
import PageClient from "./page-client";

export const metadata: Metadata = {
    alternates: { canonical: 'https://photonics-calculators.vercel.app/free-space-comms/fade-probability' },
    title: 'FSO Fade Probability',
  description: 'Gamma-gamma fade probability, mean fade time and diversity gain versus fade threshold, with aperture averaging, for an FSO link in turbulence.'
};

const jsonLd = generateCalculatorJsonLd(
  'FSO Fade Probability',
  'Gamma-gamma fade probability, mean fade time and diversity gain versus fade threshold, with aperture averaging, for an FSO link in turbulence.',
  'https://photonics-calculators.vercel.app/free-space-comms/fade-probability',
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

import type { Metadata } from "next";
import { generateCalculatorJsonLd, JsonLdScript } from '../../../lib/json-ld';
import PageClient from "./page-client";

export const metadata: Metadata = {
    alternates: { canonical: 'https://photonics-calculators.vercel.app/free-space-comms/adaptive-optics-gain' },
    title: 'Adaptive Optics Strehl Gain',
  description: 'Fitting and Greenwood temporal error, corrected Strehl ratio, AO gain, and the actuators and bandwidth needed for a target Strehl in turbulence.'
};

const jsonLd = generateCalculatorJsonLd(
  'Adaptive Optics Strehl Gain',
  'Fitting and Greenwood temporal error, corrected Strehl ratio, AO gain, and the actuators and bandwidth needed for a target Strehl in turbulence.',
  'https://photonics-calculators.vercel.app/free-space-comms/adaptive-optics-gain',
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

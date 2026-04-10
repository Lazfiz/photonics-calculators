import type { Metadata } from "next";
import { generateCalculatorJsonLd, JsonLdScript } from '../../../lib/json-ld';
import PageClient from "./page-client";

export const metadata: Metadata = {
    alternates: { canonical: 'https://photonics-calculators.vercel.app/fiber-optics/fiber-amplifier' },
    title: 'Fiber Amplifier Calculator',
    description: 'EDFA and YDFA gain, saturation, and noise figure analysis.'
};

const jsonLd = generateCalculatorJsonLd(
  'Fiber Amplifier Calculator',
  'EDFA and YDFA gain, saturation, and noise figure analysis.',
  'https://photonics-calculators.vercel.app/fiber-optics/fiber-amplifier',
  { category: 'Fiber Optics' }
);

export default function Page() {
  return (
    <>
      <JsonLdScript data={jsonLd} />
      <PageClient />
    </>
  );
}

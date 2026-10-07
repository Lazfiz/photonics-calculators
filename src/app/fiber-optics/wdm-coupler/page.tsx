import type { Metadata } from "next";
import { generateCalculatorJsonLd, JsonLdScript } from '../../../lib/json-ld';
import PageClient from "./page-client";

export const metadata: Metadata = {
    alternates: { canonical: 'https://photonics-calculators.vercel.app/fiber-optics/wdm-coupler' },
    title: 'WDM Channel Plan',
  description: 'WDM channel wavelengths, frequency spacing, ITU-T grid type (CWDM or DWDM), total bandwidth, insertion loss and isolation from channel count and spacing.'
};

const jsonLd = generateCalculatorJsonLd(
  'WDM Channel Plan',
  'WDM channel wavelengths, frequency spacing, ITU-T grid type (CWDM or DWDM), total bandwidth, insertion loss and isolation from channel count and spacing.',
  'https://photonics-calculators.vercel.app/fiber-optics/wdm-coupler',
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

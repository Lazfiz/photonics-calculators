import type { Metadata } from "next";
import { generateCalculatorJsonLd, JsonLdScript } from '../../../lib/json-ld';
import PageClient from "./page-client";

export const metadata: Metadata = {
    alternates: { canonical: 'https://photonics-calculators.vercel.app/fiber-optics/wdm-coupler' },
    title: 'Wdm Coupler',
  description: 'Interactive Wdm Coupler calculator for photonics and optical engineering.'
};

const jsonLd = generateCalculatorJsonLd(
  'Wdm Coupler',
  'Interactive Wdm Coupler calculator for photonics and optical engineering.',
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

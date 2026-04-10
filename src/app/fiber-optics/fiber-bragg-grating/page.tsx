import type { Metadata } from "next";
import { generateCalculatorJsonLd, JsonLdScript } from '../../../lib/json-ld';
import PageClient from "./page-client";

export const metadata: Metadata = {
    alternates: { canonical: 'https://photonics-calculators.vercel.app/fiber-optics/fiber-bragg-grating' },
    title: 'Fiber Bragg Grating Calculator',
    description: 'Calculate FBG reflectivity, bandwidth, and spectrum for uniform, apodized, and chirped gratings.'
};

const jsonLd = generateCalculatorJsonLd(
  'Fiber Bragg Grating Calculator',
  'Calculate FBG reflectivity, bandwidth, and spectrum for uniform, apodized, and chirped gratings.',
  'https://photonics-calculators.vercel.app/fiber-optics/fiber-bragg-grating',
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

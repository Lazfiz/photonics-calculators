import type { Metadata } from "next";
import { generateCalculatorJsonLd, JsonLdScript } from '../../../lib/json-ld';
import PageClient from "./page-client";

export const metadata: Metadata = {
    alternates: { canonical: 'https://photonics-calculators.vercel.app/spectroscopy/penetration-depth' },
    title: 'Optical Penetration Depth',
  description: "Calculate optical penetration depth from complex refractive index \u00f1 = n + ik. Includes oblique incidence via Snell's law."
};

const jsonLd = generateCalculatorJsonLd(
  'Optical Penetration Depth',
  "Calculate optical penetration depth from complex refractive index \u00f1 = n + ik. Includes oblique incidence via Snell's law.",
  'https://photonics-calculators.vercel.app/spectroscopy/penetration-depth',
  { category: 'Spectroscopy' }
);

export default function Page() {
  return (
    <>
      <JsonLdScript data={jsonLd} />
      <PageClient />
    </>
  );
}

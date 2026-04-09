import type { Metadata } from "next";
import { generateCalculatorJsonLd, JsonLdScript } from '../../../lib/json-ld';
import PageClient from "./page-client";

export const metadata: Metadata = {
    alternates: { canonical: 'https://photonics-calculators.vercel.app/materials/nonlinear-index' },
      title: 'Nonlinear Refractive Index (n)',
  description: 'Kerr effect: n = n I, where I is the optical intensity',
};
const jsonLd = generateCalculatorJsonLd(
  `Nonlinear Refractive Index (n)',
  description: 'Kerr effect: n = n I, where I is the optical intensity',
};


const jsonLd = generateCalculatorJsonLd(
  'Nonlinear Refractive Index (n)',
  'Kerr effect: n = n I, where I is the optical intensity',
  'https://photonics-calculators.vercel.app/materials/nonlinear-index',
  { category: 'Materials`,
  `Kerr effect: n = n I, where I is the optical intensity',
};


const jsonLd = generateCalculatorJsonLd(
  'Nonlinear Refractive Index (n)',
  'Kerr effect: n = n I, where I is the optical intensity',
  'https://photonics-calculators.vercel.app/materials/nonlinear-index',
  { category: 'Materials`,
  `https://photonics-calculators.vercel.app/materials/nonlinear-index`,
  { category: `Materials` }
);
export default function Page() {
  return (
    <>
      <JsonLdScript data={jsonLd} />
      <PageClient />
    </>
  );
}

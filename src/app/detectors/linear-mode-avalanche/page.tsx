import type { Metadata } from "next";
import { generateCalculatorJsonLd, JsonLdScript } from '../../../lib/json-ld';
import PageClient from "./page-client";

export const metadata: Metadata = {
    alternates: { canonical: 'https://photonics-calculators.vercel.app/detectors/linear-mode-avalanche' },
    title: 'Linear-Mode Avalanche Photodiode',
    description: 'McIntyre excess noise factor F(M), signal current and shot noise of a linear-mode APD versus gain, ionization ratio k and dark current.'
};

const jsonLd = generateCalculatorJsonLd(
  'Linear-Mode Avalanche Photodiode',
  'McIntyre excess noise factor F(M), signal current and shot noise of a linear-mode APD versus gain, ionization ratio k and dark current.',
  'https://photonics-calculators.vercel.app/detectors/linear-mode-avalanche',
  { category: 'Detectors' }
);

export default function Page() {
  return (
    <>
      <JsonLdScript data={jsonLd} />
      <PageClient />
    </>
  );
}

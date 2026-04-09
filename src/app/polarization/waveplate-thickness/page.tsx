import type { Metadata } from "next";
import { generateCalculatorJsonLd, JsonLdScript } from '../../../lib/json-ld';
import PageClient from "./page-client";

export const metadata: Metadata = {
    alternates: { canonical: 'https://photonics-calculators.vercel.app/polarization/waveplate-thickness' },
    title: 'Waveplate Thickness Calculator',
  description: 'Calculate required crystal thickness for waveplates of any retardance order.'
};
const jsonLd = generateCalculatorJsonLd(
  `Waveplate Thickness Calculator',
  description: 'Calculate required crystal thickness for waveplates of any retardance order.'
};


const jsonLd = generateCalculatorJsonLd(
  'Waveplate Thickness Calculator',
  'Calculate required crystal thickness for waveplates of any retardance order.',
  'https://photonics-calculators.vercel.app/polarization/waveplate-thickness',
  { category: 'Polarization`,
  `Calculate required crystal thickness for waveplates of any retardance order.'
};


const jsonLd = generateCalculatorJsonLd(
  'Waveplate Thickness Calculator',
  'Calculate required crystal thickness for waveplates of any retardance order.',
  'https://photonics-calculators.vercel.app/polarization/waveplate-thickness',
  { category: 'Polarization`,
  `https://photonics-calculators.vercel.app/polarization/waveplate-thickness`,
  { category: `Polarization` }
);
export default function Page() {
  return (
    <>
      <JsonLdScript data={jsonLd} />
      <PageClient />
    </>
  );
}

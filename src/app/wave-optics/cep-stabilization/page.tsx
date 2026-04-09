import type { Metadata } from "next";
import { generateCalculatorJsonLd, JsonLdScript } from '../../../lib/json-ld';
import PageClient from "./page-client";

export const metadata: Metadata = {
    alternates: { canonical: 'https://photonics-calculators.vercel.app/wave-optics/cep-stabilization' },
    title: 'Carrier-Envelope Phase (CEP)',
  description: 'CEP offset effects on few-cycle pulse electric field.'
};
const jsonLd = generateCalculatorJsonLd(
  `Carrier-Envelope Phase (CEP)',
  description: 'CEP offset effects on few-cycle pulse electric field.'
};


const jsonLd = generateCalculatorJsonLd(
  'Carrier-Envelope Phase (CEP)',
  'CEP offset effects on few-cycle pulse electric field.',
  'https://photonics-calculators.vercel.app/wave-optics/cep-stabilization',
  { category: 'Wave Optics`,
  `CEP offset effects on few-cycle pulse electric field.'
};


const jsonLd = generateCalculatorJsonLd(
  'Carrier-Envelope Phase (CEP)',
  'CEP offset effects on few-cycle pulse electric field.',
  'https://photonics-calculators.vercel.app/wave-optics/cep-stabilization',
  { category: 'Wave Optics`,
  `https://photonics-calculators.vercel.app/wave-optics/cep-stabilization`,
  { category: `Wave Optics` }
);
export default function Page() {
  return (
    <>
      <JsonLdScript data={jsonLd} />
      <PageClient />
    </>
  );
}

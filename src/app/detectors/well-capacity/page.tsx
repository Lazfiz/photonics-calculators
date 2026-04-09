import type { Metadata } from "next";
import { generateCalculatorJsonLd, JsonLdScript } from '../../../lib/json-ld';
import PageClient from "./page-client";

export const metadata: Metadata = {
    alternates: { canonical: 'https://photonics-calculators.vercel.app/detectors/well-capacity' },
      title: 'Well Capacity Dynamic Range',
  description: 'DR = 20log₀(Nwell/read). C = Nwellq/Vswing. Larger wells more DR but slower charge transfer.',
};
const jsonLd = generateCalculatorJsonLd(
  `Well Capacity Dynamic Range',
  description: 'DR = 20log₀(Nwell/read). C = Nwellq/Vswing. Larger wells more DR but slower charge transfer.',
};


const jsonLd = generateCalculatorJsonLd(
  'Well Capacity Dynamic Range',
  'DR = 20log₀(Nwell/read). C = Nwellq/Vswing. Larger wells more DR but slower charge transfer.',
  'https://photonics-calculators.vercel.app/detectors/well-capacity',
  { category: 'Detectors`,
  `DR = 20log₀(Nwell/read). C = Nwellq/Vswing. Larger wells more DR but slower charge transfer.',
};


const jsonLd = generateCalculatorJsonLd(
  'Well Capacity Dynamic Range',
  'DR = 20log₀(Nwell/read). C = Nwellq/Vswing. Larger wells more DR but slower charge transfer.',
  'https://photonics-calculators.vercel.app/detectors/well-capacity',
  { category: 'Detectors`,
  `https://photonics-calculators.vercel.app/detectors/well-capacity`,
  { category: `Detectors` }
);
export default function Page() {
  return (
    <>
      <JsonLdScript data={jsonLd} />
      <PageClient />
    </>
  );
}

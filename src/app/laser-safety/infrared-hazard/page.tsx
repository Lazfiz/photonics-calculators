import type { Metadata } from "next";
import { generateCalculatorJsonLd, JsonLdScript } from '../../../lib/json-ld';
import PageClient from "./page-client";

export const metadata: Metadata = {
    alternates: { canonical: 'https://photonics-calculators.vercel.app/laser-safety/infrared-hazard' },
    title: 'Infrared Hazard Calculator',
  description: 'Assess corneal and retinal IR hazard for 780 nm – 106 µm lasers. Covers IR-A, IR-B, and IR-C regions.'
};
const jsonLd = generateCalculatorJsonLd(
  `Infrared Hazard Calculator',
  description: 'Assess corneal and retinal IR hazard for 780 nm – 106 µm lasers. Covers IR-A, IR-B, and IR-C regions.'
};


const jsonLd = generateCalculatorJsonLd(
  'Infrared Hazard Calculator',
  'Assess corneal and retinal IR hazard for 780 nm – 106 µm lasers. Covers IR-A, IR-B, and IR-C regions.',
  'https://photonics-calculators.vercel.app/laser-safety/infrared-hazard',
  { category: 'Laser Safety`,
  `Assess corneal and retinal IR hazard for 780 nm – 106 µm lasers. Covers IR-A, IR-B, and IR-C regions.'
};


const jsonLd = generateCalculatorJsonLd(
  'Infrared Hazard Calculator',
  'Assess corneal and retinal IR hazard for 780 nm – 106 µm lasers. Covers IR-A, IR-B, and IR-C regions.',
  'https://photonics-calculators.vercel.app/laser-safety/infrared-hazard',
  { category: 'Laser Safety`,
  `https://photonics-calculators.vercel.app/laser-safety/infrared-hazard`,
  { category: `Laser Safety` }
);
export default function Page() {
  return (
    <>
      <JsonLdScript data={jsonLd} />
      <PageClient />
    </>
  );
}

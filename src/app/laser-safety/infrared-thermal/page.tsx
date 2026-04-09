import type { Metadata } from "next";
import { generateCalculatorJsonLd, JsonLdScript } from '../../../lib/json-ld';
import PageClient from "./page-client";

export const metadata: Metadata = {
    alternates: { canonical: 'https://photonics-calculators.vercel.app/laser-safety/infrared-thermal' },
    title: 'Infrared Thermal Limits',
  description: 'Calculates MPE for infrared lasers (780nm–1000µm) covering corneal thermal and retinal thermal hazards per ANSI Z136.1.'
};
const jsonLd = generateCalculatorJsonLd(
  `Infrared Thermal Limits',
  description: 'Calculates MPE for infrared lasers (780nm–1000µm) covering corneal thermal and retinal thermal hazards per ANSI Z136.1.'
};


const jsonLd = generateCalculatorJsonLd(
  'Infrared Thermal Limits',
  'Calculates MPE for infrared lasers (780nm–1000µm) covering corneal thermal and retinal thermal hazards per ANSI Z136.1.',
  'https://photonics-calculators.vercel.app/laser-safety/infrared-thermal',
  { category: 'Laser Safety`,
  `Calculates MPE for infrared lasers (780nm–1000µm) covering corneal thermal and retinal thermal hazards per ANSI Z136.1.'
};


const jsonLd = generateCalculatorJsonLd(
  'Infrared Thermal Limits',
  'Calculates MPE for infrared lasers (780nm–1000µm) covering corneal thermal and retinal thermal hazards per ANSI Z136.1.',
  'https://photonics-calculators.vercel.app/laser-safety/infrared-thermal',
  { category: 'Laser Safety`,
  `https://photonics-calculators.vercel.app/laser-safety/infrared-thermal`,
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

import type { Metadata } from "next";
import { generateCalculatorJsonLd, JsonLdScript } from '../../../lib/json-ld';
import PageClient from "./page-client";

export const metadata: Metadata = {
    alternates: { canonical: 'https://photonics-calculators.vercel.app/fiber-optics/connector-return' },
      title: 'Connector Return Loss',
  description: 'Calculates return loss (RL) and insertion loss (IL) for fiber connectors with air gaps, lateral offsets, and angular misalignment.',
};
const jsonLd = generateCalculatorJsonLd(
  `Connector Return Loss',
  description: 'Calculates return loss (RL) and insertion loss (IL) for fiber connectors with air gaps, lateral offsets, and angular misalignment.',
};


const jsonLd = generateCalculatorJsonLd(
  'Connector Return Loss',
  'Calculates return loss (RL) and insertion loss (IL) for fiber connectors with air gaps, lateral offsets, and angular misalignment.',
  'https://photonics-calculators.vercel.app/fiber-optics/connector-return',
  { category: 'Fiber Optics`,
  `Calculates return loss (RL) and insertion loss (IL) for fiber connectors with air gaps, lateral offsets, and angular misalignment.',
};


const jsonLd = generateCalculatorJsonLd(
  'Connector Return Loss',
  'Calculates return loss (RL) and insertion loss (IL) for fiber connectors with air gaps, lateral offsets, and angular misalignment.',
  'https://photonics-calculators.vercel.app/fiber-optics/connector-return',
  { category: 'Fiber Optics`,
  `https://photonics-calculators.vercel.app/fiber-optics/connector-return`,
  { category: `Fiber Optics` }
);
export default function Page() {
  return (
    <>
      <JsonLdScript data={jsonLd} />
      <PageClient />
    </>
  );
}

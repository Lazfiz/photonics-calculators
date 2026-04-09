import type { Metadata } from "next";
import { generateCalculatorJsonLd, JsonLdScript } from '../../../lib/json-ld';
import PageClient from "./page-client";

export const metadata: Metadata = {
    alternates: { canonical: 'https://photonics-calculators.vercel.app/fiber-optics/connector-return-loss' },
    title: 'Connector Return Loss',
  description: 'Calculate return loss (ORL) from fiber connectors based on polish type and index mismatch.'
};
const jsonLd = generateCalculatorJsonLd(
  `Connector Return Loss',
  description: 'Calculate return loss (ORL) from fiber connectors based on polish type and index mismatch.'
};


const jsonLd = generateCalculatorJsonLd(
  'Connector Return Loss',
  'Calculate return loss (ORL) from fiber connectors based on polish type and index mismatch.',
  'https://photonics-calculators.vercel.app/fiber-optics/connector-return-loss',
  { category: 'Fiber Optics`,
  `Calculate return loss (ORL) from fiber connectors based on polish type and index mismatch.'
};


const jsonLd = generateCalculatorJsonLd(
  'Connector Return Loss',
  'Calculate return loss (ORL) from fiber connectors based on polish type and index mismatch.',
  'https://photonics-calculators.vercel.app/fiber-optics/connector-return-loss',
  { category: 'Fiber Optics`,
  `https://photonics-calculators.vercel.app/fiber-optics/connector-return-loss`,
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

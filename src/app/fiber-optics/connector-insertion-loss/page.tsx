import type { Metadata } from "next";
import { generateCalculatorJsonLd, JsonLdScript } from '../../../lib/json-ld';
import PageClient from "./page-client";

export const metadata: Metadata = {
    alternates: { canonical: 'https://photonics-calculators.vercel.app/fiber-optics/connector-insertion-loss' },
    title: 'Connector Insertion Loss',
  description: 'Calculate connector insertion loss from misalignment parameters and build link budgets for different connector types.'
};
const jsonLd = generateCalculatorJsonLd(
  `Connector Insertion Loss',
  description: 'Calculate connector insertion loss from misalignment parameters and build link budgets for different connector types.'
};


const jsonLd = generateCalculatorJsonLd(
  'Connector Insertion Loss',
  'Calculate connector insertion loss from misalignment parameters and build link budgets for different connector types.',
  'https://photonics-calculators.vercel.app/fiber-optics/connector-insertion-loss',
  { category: 'Fiber Optics`,
  `Calculate connector insertion loss from misalignment parameters and build link budgets for different connector types.'
};


const jsonLd = generateCalculatorJsonLd(
  'Connector Insertion Loss',
  'Calculate connector insertion loss from misalignment parameters and build link budgets for different connector types.',
  'https://photonics-calculators.vercel.app/fiber-optics/connector-insertion-loss',
  { category: 'Fiber Optics`,
  `https://photonics-calculators.vercel.app/fiber-optics/connector-insertion-loss`,
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

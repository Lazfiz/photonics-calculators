import type { Metadata } from "next";
import { generateCalculatorJsonLd, JsonLdScript } from '../../../lib/json-ld';
import PageClient from "./page-client";

export const metadata: Metadata = {
    alternates: { canonical: 'https://photonics-calculators.vercel.app/fiber-optics/link-budget' },
    title: 'Fiber Link Budget',
  description: 'Total optical link loss budget calculator. Power budget vs. accumulated losses.'
};
const jsonLd = generateCalculatorJsonLd(
  `Fiber Link Budget',
  description: 'Total optical link loss budget calculator. Power budget vs. accumulated losses.'
};


const jsonLd = generateCalculatorJsonLd(
  'Fiber Link Budget',
  'Total optical link loss budget calculator. Power budget vs. accumulated losses.',
  'https://photonics-calculators.vercel.app/fiber-optics/link-budget',
  { category: 'Fiber Optics`,
  `Total optical link loss budget calculator. Power budget vs. accumulated losses.'
};


const jsonLd = generateCalculatorJsonLd(
  'Fiber Link Budget',
  'Total optical link loss budget calculator. Power budget vs. accumulated losses.',
  'https://photonics-calculators.vercel.app/fiber-optics/link-budget',
  { category: 'Fiber Optics`,
  `https://photonics-calculators.vercel.app/fiber-optics/link-budget`,
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

import type { Metadata } from "next";
import { generateCalculatorJsonLd, JsonLdScript } from '../../../lib/json-ld';
import PageClient from "./page-client";

export const metadata: Metadata = {
    alternates: { canonical: 'https://photonics-calculators.vercel.app/fiber-optics/specialty-fiber' },
    title: 'Specialty Fiber Types',
  description: 'Compare properties of specialty optical fibers: PM, PCF, rare-earth doped, chalcogenide, and fluoride.'
};
const jsonLd = generateCalculatorJsonLd(
  `Specialty Fiber Types',
  description: 'Compare properties of specialty optical fibers: PM, PCF, rare-earth doped, chalcogenide, and fluoride.'
};


const jsonLd = generateCalculatorJsonLd(
  'Specialty Fiber Types',
  'Compare properties of specialty optical fibers: PM, PCF, rare-earth doped, chalcogenide, and fluoride.',
  'https://photonics-calculators.vercel.app/fiber-optics/specialty-fiber',
  { category: 'Fiber Optics`,
  `Compare properties of specialty optical fibers: PM, PCF, rare-earth doped, chalcogenide, and fluoride.'
};


const jsonLd = generateCalculatorJsonLd(
  'Specialty Fiber Types',
  'Compare properties of specialty optical fibers: PM, PCF, rare-earth doped, chalcogenide, and fluoride.',
  'https://photonics-calculators.vercel.app/fiber-optics/specialty-fiber',
  { category: 'Fiber Optics`,
  `https://photonics-calculators.vercel.app/fiber-optics/specialty-fiber`,
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

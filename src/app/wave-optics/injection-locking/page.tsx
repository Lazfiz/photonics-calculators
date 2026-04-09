import type { Metadata } from "next";
import { generateCalculatorJsonLd, JsonLdScript } from '../../../lib/json-ld';
import PageClient from "./page-client";

export const metadata: Metadata = {
    alternates: { canonical: 'https://photonics-calculators.vercel.app/wave-optics/injection-locking' },
    title: 'Injection Locking',
  description: 'Phase-locking a slave laser to a master laser through optical injection.'
};
const jsonLd = generateCalculatorJsonLd(
  `Injection Locking',
  description: 'Phase-locking a slave laser to a master laser through optical injection.'
};


const jsonLd = generateCalculatorJsonLd(
  'Injection Locking',
  'Phase-locking a slave laser to a master laser through optical injection.',
  'https://photonics-calculators.vercel.app/wave-optics/injection-locking',
  { category: 'Wave Optics`,
  `Phase-locking a slave laser to a master laser through optical injection.'
};


const jsonLd = generateCalculatorJsonLd(
  'Injection Locking',
  'Phase-locking a slave laser to a master laser through optical injection.',
  'https://photonics-calculators.vercel.app/wave-optics/injection-locking',
  { category: 'Wave Optics`,
  `https://photonics-calculators.vercel.app/wave-optics/injection-locking`,
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

import type { Metadata } from "next";
import { generateCalculatorJsonLd, JsonLdScript } from '../../../lib/json-ld';
import PageClient from "./page-client";

export const metadata: Metadata = {
    alternates: { canonical: 'https://photonics-calculators.vercel.app/fiber-optics/dispersion-map' },
    title: 'Dispersion Map Calculator',
  description: 'Design a dispersion map for a fiber link using SMF and DCF segments.'
};
const jsonLd = generateCalculatorJsonLd(
  `Dispersion Map Calculator',
  description: 'Design a dispersion map for a fiber link using SMF and DCF segments.'
};


const jsonLd = generateCalculatorJsonLd(
  'Dispersion Map Calculator',
  'Design a dispersion map for a fiber link using SMF and DCF segments.',
  'https://photonics-calculators.vercel.app/fiber-optics/dispersion-map',
  { category: 'Fiber Optics`,
  `Design a dispersion map for a fiber link using SMF and DCF segments.'
};


const jsonLd = generateCalculatorJsonLd(
  'Dispersion Map Calculator',
  'Design a dispersion map for a fiber link using SMF and DCF segments.',
  'https://photonics-calculators.vercel.app/fiber-optics/dispersion-map',
  { category: 'Fiber Optics`,
  `https://photonics-calculators.vercel.app/fiber-optics/dispersion-map`,
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

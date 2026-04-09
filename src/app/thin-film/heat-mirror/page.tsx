import type { Metadata } from "next";
import { generateCalculatorJsonLd, JsonLdScript } from '../../../lib/json-ld';
import PageClient from "./page-client";

export const metadata: Metadata = {
    alternates: { canonical: 'https://photonics-calculators.vercel.app/thin-film/heat-mirror' },
      title: 'Heat Mirror Design',
  description: 'Heat mirrors reflect infrared (thermal radiation) while transmitting visible light.',
};
const jsonLd = generateCalculatorJsonLd(
  `Heat Mirror Design',
  description: 'Heat mirrors reflect infrared (thermal radiation) while transmitting visible light.',
};


const jsonLd = generateCalculatorJsonLd(
  'Heat Mirror Design',
  'Heat mirrors reflect infrared (thermal radiation) while transmitting visible light.',
  'https://photonics-calculators.vercel.app/thin-film/heat-mirror',
  { category: 'Thin Film`,
  `Heat mirrors reflect infrared (thermal radiation) while transmitting visible light.',
};


const jsonLd = generateCalculatorJsonLd(
  'Heat Mirror Design',
  'Heat mirrors reflect infrared (thermal radiation) while transmitting visible light.',
  'https://photonics-calculators.vercel.app/thin-film/heat-mirror',
  { category: 'Thin Film`,
  `https://photonics-calculators.vercel.app/thin-film/heat-mirror`,
  { category: `Thin Film` }
);
export default function Page() {
  return (
    <>
      <JsonLdScript data={jsonLd} />
      <PageClient />
    </>
  );
}

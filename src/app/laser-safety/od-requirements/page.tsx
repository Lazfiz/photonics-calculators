import type { Metadata } from "next";
import { generateCalculatorJsonLd, JsonLdScript } from '../../../lib/json-ld';
import PageClient from "./page-client";

export const metadata: Metadata = {
    alternates: { canonical: 'https://photonics-calculators.vercel.app/laser-safety/od-requirements' },
    title: 'OD Requirements (manual validated-limit mode)',
  description: 'Manual validated-limit optical-density math for laser safety workflows when the irradiance limit has already been obtained externally.'
};
const jsonLd = generateCalculatorJsonLd(
  `OD Requirements (manual validated-limit mode)',
  description: 'Manual validated-limit optical-density math for laser safety workflows when the irradiance limit has already been obtained externally.'
};


const jsonLd = generateCalculatorJsonLd(
  'OD Requirements (manual validated-limit mode)',
  'Manual validated-limit optical-density math for laser safety workflows when the irradiance limit has already been obtained externally.',
  'https://photonics-calculators.vercel.app/laser-safety/od-requirements',
  { category: 'Laser Safety`,
  `Manual validated-limit optical-density math for laser safety workflows when the irradiance limit has already been obtained externally.'
};


const jsonLd = generateCalculatorJsonLd(
  'OD Requirements (manual validated-limit mode)',
  'Manual validated-limit optical-density math for laser safety workflows when the irradiance limit has already been obtained externally.',
  'https://photonics-calculators.vercel.app/laser-safety/od-requirements',
  { category: 'Laser Safety`,
  `https://photonics-calculators.vercel.app/laser-safety/od-requirements`,
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

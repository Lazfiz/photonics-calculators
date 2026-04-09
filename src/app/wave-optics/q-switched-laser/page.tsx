import type { Metadata } from "next";
import { generateCalculatorJsonLd, JsonLdScript } from '../../../lib/json-ld';
import PageClient from "./page-client";

export const metadata: Metadata = {
    alternates: { canonical: 'https://photonics-calculators.vercel.app/wave-optics/q-switched-laser' },
    title: 'Q-Switched Laser',
  description: 'High-energy pulse generation through repetitive Q-switching of a laser cavity.'
};
const jsonLd = generateCalculatorJsonLd(
  `Q-Switched Laser',
  description: 'High-energy pulse generation through repetitive Q-switching of a laser cavity.'
};


const jsonLd = generateCalculatorJsonLd(
  'Q-Switched Laser',
  'High-energy pulse generation through repetitive Q-switching of a laser cavity.',
  'https://photonics-calculators.vercel.app/wave-optics/q-switched-laser',
  { category: 'Wave Optics`,
  `High-energy pulse generation through repetitive Q-switching of a laser cavity.'
};


const jsonLd = generateCalculatorJsonLd(
  'Q-Switched Laser',
  'High-energy pulse generation through repetitive Q-switching of a laser cavity.',
  'https://photonics-calculators.vercel.app/wave-optics/q-switched-laser',
  { category: 'Wave Optics`,
  `https://photonics-calculators.vercel.app/wave-optics/q-switched-laser`,
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

import type { Metadata } from "next";
import { generateCalculatorJsonLd, JsonLdScript } from '../../../lib/json-ld';
import PageClient from "./page-client";

export const metadata: Metadata = {
    alternates: { canonical: 'https://photonics-calculators.vercel.app/wave-optics/mode-locked-laser' },
    title: 'Mode-Locked Laser',
  description: 'Ultrashort pulse generation through passive or active mode-locking.'
};
const jsonLd = generateCalculatorJsonLd(
  `Mode-Locked Laser',
  description: 'Ultrashort pulse generation through passive or active mode-locking.'
};


const jsonLd = generateCalculatorJsonLd(
  'Mode-Locked Laser',
  'Ultrashort pulse generation through passive or active mode-locking.',
  'https://photonics-calculators.vercel.app/wave-optics/mode-locked-laser',
  { category: 'Wave Optics`,
  `Ultrashort pulse generation through passive or active mode-locking.'
};


const jsonLd = generateCalculatorJsonLd(
  'Mode-Locked Laser',
  'Ultrashort pulse generation through passive or active mode-locking.',
  'https://photonics-calculators.vercel.app/wave-optics/mode-locked-laser',
  { category: 'Wave Optics`,
  `https://photonics-calculators.vercel.app/wave-optics/mode-locked-laser`,
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

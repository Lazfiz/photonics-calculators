import type { Metadata } from "next";
import { generateCalculatorJsonLd, JsonLdScript } from '../../../lib/json-ld';
import PageClient from "./page-client";

export const metadata: Metadata = {
    alternates: { canonical: 'https://photonics-calculators.vercel.app/laser-safety/ultrafast-laser-safety' },
    title: 'Ultrafast Laser Safety Calculator',
  description: 'Evaluate single-pulse, average-power, and PRF-corrected MPE for femtosecond/picosecond laser systems.'
};
const jsonLd = generateCalculatorJsonLd(
  `Ultrafast Laser Safety Calculator',
  description: 'Evaluate single-pulse, average-power, and PRF-corrected MPE for femtosecond/picosecond laser systems.'
};


const jsonLd = generateCalculatorJsonLd(
  'Ultrafast Laser Safety Calculator',
  'Evaluate single-pulse, average-power, and PRF-corrected MPE for femtosecond/picosecond laser systems.',
  'https://photonics-calculators.vercel.app/laser-safety/ultrafast-laser-safety',
  { category: 'Laser Safety`,
  `Evaluate single-pulse, average-power, and PRF-corrected MPE for femtosecond/picosecond laser systems.'
};


const jsonLd = generateCalculatorJsonLd(
  'Ultrafast Laser Safety Calculator',
  'Evaluate single-pulse, average-power, and PRF-corrected MPE for femtosecond/picosecond laser systems.',
  'https://photonics-calculators.vercel.app/laser-safety/ultrafast-laser-safety',
  { category: 'Laser Safety`,
  `https://photonics-calculators.vercel.app/laser-safety/ultrafast-laser-safety`,
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

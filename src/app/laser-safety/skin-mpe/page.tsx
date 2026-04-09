import type { Metadata } from "next";
import { generateCalculatorJsonLd, JsonLdScript } from '../../../lib/json-ld';
import PageClient from "./page-client";

export const metadata: Metadata = {
    alternates: { canonical: 'https://photonics-calculators.vercel.app/laser-safety/skin-mpe' },
    title: 'Skin MPE Calculator',
  description: 'Maximum permissible exposure for skin (ANSI Z136 simplified). Not for clinical safety decisions.'
};
const jsonLd = generateCalculatorJsonLd(
  `Skin MPE Calculator',
  description: 'Maximum permissible exposure for skin (ANSI Z136 simplified). Not for clinical safety decisions.'
};


const jsonLd = generateCalculatorJsonLd(
  'Skin MPE Calculator',
  'Maximum permissible exposure for skin (ANSI Z136 simplified). Not for clinical safety decisions.',
  'https://photonics-calculators.vercel.app/laser-safety/skin-mpe',
  { category: 'Laser Safety`,
  `Maximum permissible exposure for skin (ANSI Z136 simplified). Not for clinical safety decisions.'
};


const jsonLd = generateCalculatorJsonLd(
  'Skin MPE Calculator',
  'Maximum permissible exposure for skin (ANSI Z136 simplified). Not for clinical safety decisions.',
  'https://photonics-calculators.vercel.app/laser-safety/skin-mpe',
  { category: 'Laser Safety`,
  `https://photonics-calculators.vercel.app/laser-safety/skin-mpe`,
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

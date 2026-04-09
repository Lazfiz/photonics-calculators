import type { Metadata } from "next";
import { generateCalculatorJsonLd, JsonLdScript } from '../../../lib/json-ld';
import PageClient from "./page-client";

export const metadata: Metadata = {
    alternates: { canonical: 'https://photonics-calculators.vercel.app/laser-safety/mpe' },
    title: 'Maximum Permissible Exposure (MPE)',
  description: 'Bounded CW point-source MPE pre-check for 400–1050 nm and 1 ms to 310^4 s using explicitly implemented ANSI-style table slices.'
};
const jsonLd = generateCalculatorJsonLd(
  `Maximum Permissible Exposure (MPE)',
  description: 'Bounded CW point-source MPE pre-check for 400–1050 nm and 1 ms to 310^4 s using explicitly implemented ANSI-style table slices.'
};


const jsonLd = generateCalculatorJsonLd(
  'Maximum Permissible Exposure (MPE)',
  'Bounded CW point-source MPE pre-check for 400–1050 nm and 1 ms to 310^4 s using explicitly implemented ANSI-style table slices.',
  'https://photonics-calculators.vercel.app/laser-safety/mpe',
  { category: 'Laser Safety`,
  `Bounded CW point-source MPE pre-check for 400–1050 nm and 1 ms to 310^4 s using explicitly implemented ANSI-style table slices.'
};


const jsonLd = generateCalculatorJsonLd(
  'Maximum Permissible Exposure (MPE)',
  'Bounded CW point-source MPE pre-check for 400–1050 nm and 1 ms to 310^4 s using explicitly implemented ANSI-style table slices.',
  'https://photonics-calculators.vercel.app/laser-safety/mpe',
  { category: 'Laser Safety`,
  `https://photonics-calculators.vercel.app/laser-safety/mpe`,
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

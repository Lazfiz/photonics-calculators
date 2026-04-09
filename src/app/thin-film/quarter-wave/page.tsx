import type { Metadata } from "next";
import { generateCalculatorJsonLd, JsonLdScript } from '../../../lib/json-ld';
import PageClient from "./page-client";

export const metadata: Metadata = {
    alternates: { canonical: 'https://photonics-calculators.vercel.app/thin-film/quarter-wave' },
      title: 'Quarter-Wave Thickness',
  description: 'Quarter-wave optical thickness (QWOT): nd = /4. Optimal AR when nfilm = (nincnsub).',
};
const jsonLd = generateCalculatorJsonLd(
  `Quarter-Wave Thickness',
  description: 'Quarter-wave optical thickness (QWOT): nd = /4. Optimal AR when nfilm = (nincnsub).',
};


const jsonLd = generateCalculatorJsonLd(
  'Quarter-Wave Thickness',
  'Quarter-wave optical thickness (QWOT): nd = /4. Optimal AR when nfilm = (nincnsub).',
  'https://photonics-calculators.vercel.app/thin-film/quarter-wave',
  { category: 'Thin Film`,
  `Quarter-wave optical thickness (QWOT): nd = /4. Optimal AR when nfilm = (nincnsub).',
};


const jsonLd = generateCalculatorJsonLd(
  'Quarter-Wave Thickness',
  'Quarter-wave optical thickness (QWOT): nd = /4. Optimal AR when nfilm = (nincnsub).',
  'https://photonics-calculators.vercel.app/thin-film/quarter-wave',
  { category: 'Thin Film`,
  `https://photonics-calculators.vercel.app/thin-film/quarter-wave`,
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

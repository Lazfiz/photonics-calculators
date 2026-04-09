import type { Metadata } from "next";
import { generateCalculatorJsonLd, JsonLdScript } from '../../../lib/json-ld';
import PageClient from "./page-client";

export const metadata: Metadata = {
    alternates: { canonical: 'https://photonics-calculators.vercel.app/thin-film/cold-mirror' },
      title: 'Cold Mirror Design',
  description: 'Cold mirrors reflect visible light while transmitting infrared. Used in projector systems',
};
const jsonLd = generateCalculatorJsonLd(
  `Cold Mirror Design',
  description: 'Cold mirrors reflect visible light while transmitting infrared. Used in projector systems',
};


const jsonLd = generateCalculatorJsonLd(
  'Cold Mirror Design',
  'Cold mirrors reflect visible light while transmitting infrared. Used in projector systems',
  'https://photonics-calculators.vercel.app/thin-film/cold-mirror',
  { category: 'Thin Film`,
  `Cold mirrors reflect visible light while transmitting infrared. Used in projector systems',
};


const jsonLd = generateCalculatorJsonLd(
  'Cold Mirror Design',
  'Cold mirrors reflect visible light while transmitting infrared. Used in projector systems',
  'https://photonics-calculators.vercel.app/thin-film/cold-mirror',
  { category: 'Thin Film`,
  `https://photonics-calculators.vercel.app/thin-film/cold-mirror`,
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

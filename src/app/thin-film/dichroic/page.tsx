import type { Metadata } from "next";
import { generateCalculatorJsonLd, JsonLdScript } from '../../../lib/json-ld';
import PageClient from "./page-client";

export const metadata: Metadata = {
    alternates: { canonical: 'https://photonics-calculators.vercel.app/thin-film/dichroic' },
      title: 'Dichroic Beam Splitter',
  description: 'Dichroic beam splitter at oblique incidence. Shows s- and p-polarisation splitting characteristic of dichroic filters used at 45°.',
};
const jsonLd = generateCalculatorJsonLd(
  `Dichroic Beam Splitter',
  description: 'Dichroic beam splitter at oblique incidence. Shows s- and p-polarisation splitting characteristic of dichroic filters used at 45°.',
};


const jsonLd = generateCalculatorJsonLd(
  'Dichroic Beam Splitter',
  'Dichroic beam splitter at oblique incidence. Shows s- and p-polarisation splitting characteristic of dichroic filters used at 45°.',
  'https://photonics-calculators.vercel.app/thin-film/dichroic',
  { category: 'Thin Film`,
  `Dichroic beam splitter at oblique incidence. Shows s- and p-polarisation splitting characteristic of dichroic filters used at 45°.',
};


const jsonLd = generateCalculatorJsonLd(
  'Dichroic Beam Splitter',
  'Dichroic beam splitter at oblique incidence. Shows s- and p-polarisation splitting characteristic of dichroic filters used at 45°.',
  'https://photonics-calculators.vercel.app/thin-film/dichroic',
  { category: 'Thin Film`,
  `https://photonics-calculators.vercel.app/thin-film/dichroic`,
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

import type { Metadata } from "next";
import { generateCalculatorJsonLd, JsonLdScript } from '../../../lib/json-ld';
import PageClient from "./page-client";

export const metadata: Metadata = {
    alternates: { canonical: 'https://photonics-calculators.vercel.app/imaging/computational-imaging' },
    title: 'Computational Imaging',
  description: 'Multi-view fusion, resolution scaling, and SNR improvement through computational techniques.'
};
const jsonLd = generateCalculatorJsonLd(
  `Computational Imaging',
  description: 'Multi-view fusion, resolution scaling, and SNR improvement through computational techniques.'
};


const jsonLd = generateCalculatorJsonLd(
  'Computational Imaging',
  'Multi-view fusion, resolution scaling, and SNR improvement through computational techniques.',
  'https://photonics-calculators.vercel.app/imaging/computational-imaging',
  { category: 'Imaging`,
  `Multi-view fusion, resolution scaling, and SNR improvement through computational techniques.'
};


const jsonLd = generateCalculatorJsonLd(
  'Computational Imaging',
  'Multi-view fusion, resolution scaling, and SNR improvement through computational techniques.',
  'https://photonics-calculators.vercel.app/imaging/computational-imaging',
  { category: 'Imaging`,
  `https://photonics-calculators.vercel.app/imaging/computational-imaging`,
  { category: `Imaging` }
);
export default function Page() {
  return (
    <>
      <JsonLdScript data={jsonLd} />
      <PageClient />
    </>
  );
}

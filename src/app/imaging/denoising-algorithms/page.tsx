import type { Metadata } from "next";
import { generateCalculatorJsonLd, JsonLdScript } from '../../../lib/json-ld';
import PageClient from "./page-client";

export const metadata: Metadata = {
    alternates: { canonical: 'https://photonics-calculators.vercel.app/imaging/denoising-algorithms' },
    title: 'Denoising Algorithms',
  description: 'Compare denoising methods: noise reduction, detail preservation, and SNR improvement tradeoffs.'
};
const jsonLd = generateCalculatorJsonLd(
  `Denoising Algorithms',
  description: 'Compare denoising methods: noise reduction, detail preservation, and SNR improvement tradeoffs.'
};


const jsonLd = generateCalculatorJsonLd(
  'Denoising Algorithms',
  'Compare denoising methods: noise reduction, detail preservation, and SNR improvement tradeoffs.',
  'https://photonics-calculators.vercel.app/imaging/denoising-algorithms',
  { category: 'Imaging`,
  `Compare denoising methods: noise reduction, detail preservation, and SNR improvement tradeoffs.'
};


const jsonLd = generateCalculatorJsonLd(
  'Denoising Algorithms',
  'Compare denoising methods: noise reduction, detail preservation, and SNR improvement tradeoffs.',
  'https://photonics-calculators.vercel.app/imaging/denoising-algorithms',
  { category: 'Imaging`,
  `https://photonics-calculators.vercel.app/imaging/denoising-algorithms`,
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

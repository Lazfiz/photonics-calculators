import type { Metadata } from "next";
import { generateCalculatorJsonLd, JsonLdScript } from '../../../lib/json-ld';
import PageClient from "./page-client";

export const metadata: Metadata = {
    alternates: { canonical: 'https://photonics-calculators.vercel.app/thin-film/ion-assisted-deposition' },
    title: 'Ion-Assisted Deposition (IAD)',
  description: 'Design ion beam parameters for improved packing density and stress control. Models ion-to-atom ratio, packing density, and compressive stress.'
};
const jsonLd = generateCalculatorJsonLd(
  `Ion-Assisted Deposition (IAD)',
  description: 'Design ion beam parameters for improved packing density and stress control. Models ion-to-atom ratio, packing density, and compressive stress.'
};


const jsonLd = generateCalculatorJsonLd(
  'Ion-Assisted Deposition (IAD)',
  'Design ion beam parameters for improved packing density and stress control. Models ion-to-atom ratio, packing density, and compressive stress.',
  'https://photonics-calculators.vercel.app/thin-film/ion-assisted-deposition',
  { category: 'Thin Film`,
  `Design ion beam parameters for improved packing density and stress control. Models ion-to-atom ratio, packing density, and compressive stress.'
};


const jsonLd = generateCalculatorJsonLd(
  'Ion-Assisted Deposition (IAD)',
  'Design ion beam parameters for improved packing density and stress control. Models ion-to-atom ratio, packing density, and compressive stress.',
  'https://photonics-calculators.vercel.app/thin-film/ion-assisted-deposition',
  { category: 'Thin Film`,
  `https://photonics-calculators.vercel.app/thin-film/ion-assisted-deposition`,
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

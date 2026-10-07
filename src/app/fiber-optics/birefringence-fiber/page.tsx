import type { Metadata } from "next";
import { generateCalculatorJsonLd, JsonLdScript } from '../../../lib/json-ld';
import PageClient from "./page-client";

export const metadata: Metadata = {
    alternates: { canonical: 'https://photonics-calculators.vercel.app/fiber-optics/birefringence-fiber' },
    title: 'Birefringence Fiber Calculator',
    description: 'Geometric (elliptical-core) and stress-induced birefringence and beat length of a single-mode fiber from core and cladding indices and core shape.'
};

const jsonLd = generateCalculatorJsonLd(
  'Birefringence Fiber Calculator',
  'Geometric (elliptical-core) and stress-induced birefringence and beat length of a single-mode fiber from core and cladding indices and core shape.',
  'https://photonics-calculators.vercel.app/fiber-optics/birefringence-fiber',
  { category: 'Fiber Optics' }
);

export default function Page() {
  return (
    <>
      <JsonLdScript data={jsonLd} />
      <PageClient />
    </>
  );
}

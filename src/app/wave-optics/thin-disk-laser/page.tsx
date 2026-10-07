import type { Metadata } from "next";
import { generateCalculatorJsonLd, JsonLdScript } from '../../../lib/json-ld';
import PageClient from "./page-client";

export const metadata: Metadata = {
    alternates: { canonical: 'https://photonics-calculators.vercel.app/wave-optics/thin-disk-laser' },
    title: 'Yb Thin-Disk Laser',
  description: 'Multipass pump absorption, threshold, slope efficiency, temperature rise and thermal lens of a Yb thin-disk laser from disk thickness and doping.'
};

const jsonLd = generateCalculatorJsonLd(
  'Yb Thin-Disk Laser',
  'Multipass pump absorption, threshold, slope efficiency, temperature rise and thermal lens of a Yb thin-disk laser from disk thickness and doping.',
  'https://photonics-calculators.vercel.app/wave-optics/thin-disk-laser',
  { category: 'Wave Optics' }
);

export default function Page() {
  return (
    <>
      <JsonLdScript data={jsonLd} />
      <PageClient />
    </>
  );
}

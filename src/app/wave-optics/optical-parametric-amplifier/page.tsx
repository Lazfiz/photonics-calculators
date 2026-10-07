import type { Metadata } from "next";
import { generateCalculatorJsonLd, JsonLdScript } from '../../../lib/json-ld';
import PageClient from "./page-client";

export const metadata: Metadata = {
    alternates: { canonical: 'https://photonics-calculators.vercel.app/wave-optics/optical-parametric-amplifier' },
    title: 'Optical Parametric Amplifier',
  description: 'Parametric power gain of an OPA from pump intensity, d_eff, refractive indices and crystal length, versus pump power, length and signal wavelength.'
};

const jsonLd = generateCalculatorJsonLd(
  'Optical Parametric Amplifier',
  'Parametric power gain of an OPA from pump intensity, d_eff, refractive indices and crystal length, versus pump power, length and signal wavelength.',
  'https://photonics-calculators.vercel.app/wave-optics/optical-parametric-amplifier',
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

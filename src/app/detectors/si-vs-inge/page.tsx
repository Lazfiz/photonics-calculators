import type { Metadata } from "next";
import { generateCalculatorJsonLd, JsonLdScript } from '../../../lib/json-ld';
import PageClient from "./page-client";

export const metadata: Metadata = {
    alternates: { canonical: 'https://photonics-calculators.vercel.app/detectors/si-vs-inge' },
    title: 'Si vs InGaAs Detectors',
    description: 'Compare silicon and InGaAs photodetectors: QE spectra, SNR, dark current, and wavelength performance.'
};

const jsonLd = generateCalculatorJsonLd(
  'Si vs InGaAs Detectors',
  'Compare silicon and InGaAs photodetectors: QE spectra, SNR, dark current, and wavelength performance.',
  'https://photonics-calculators.vercel.app/detectors/si-vs-inge',
  { category: 'Detectors' }
);

export default function Page() {
  return (
    <>
      <JsonLdScript data={jsonLd} />
      <PageClient />
    </>
  );
}

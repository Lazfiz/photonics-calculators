import type { Metadata } from "next";
import { generateCalculatorJsonLd, JsonLdScript } from '../../../lib/json-ld';
import PageClient from "./page-client";

export const metadata: Metadata = {
    alternates: { canonical: 'https://photonics-calculators.vercel.app/spectroscopy/doppler-broadening' },
    title: 'Doppler Broadening Calculator',
  description: 'Calculate Doppler (thermal) line broadening FWHM from gas temperature and atomic/molecular mass.'
};
const jsonLd = generateCalculatorJsonLd(
  `Doppler Broadening Calculator',
  description: 'Calculate Doppler (thermal) line broadening FWHM from gas temperature and atomic/molecular mass.'
};


const jsonLd = generateCalculatorJsonLd(
  'Doppler Broadening Calculator',
  'Calculate Doppler (thermal) line broadening FWHM from gas temperature and atomic/molecular mass.',
  'https://photonics-calculators.vercel.app/spectroscopy/doppler-broadening',
  { category: 'Spectroscopy`,
  `Calculate Doppler (thermal) line broadening FWHM from gas temperature and atomic/molecular mass.'
};


const jsonLd = generateCalculatorJsonLd(
  'Doppler Broadening Calculator',
  'Calculate Doppler (thermal) line broadening FWHM from gas temperature and atomic/molecular mass.',
  'https://photonics-calculators.vercel.app/spectroscopy/doppler-broadening',
  { category: 'Spectroscopy`,
  `https://photonics-calculators.vercel.app/spectroscopy/doppler-broadening`,
  { category: `Spectroscopy` }
);
export default function Page() {
  return (
    <>
      <JsonLdScript data={jsonLd} />
      <PageClient />
    </>
  );
}

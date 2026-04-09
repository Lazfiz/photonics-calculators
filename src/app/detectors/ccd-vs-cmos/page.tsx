import type { Metadata } from "next";
import { generateCalculatorJsonLd, JsonLdScript } from '../../../lib/json-ld';
import PageClient from "./page-client";

export const metadata: Metadata = {
    alternates: { canonical: 'https://photonics-calculators.vercel.app/detectors/ccd-vs-cmos' },
    title: 'CCD vs CMOS Sensor Comparison',
  description: 'Compare sensor architectures — SNR, dynamic range, and performance metrics.'
};
const jsonLd = generateCalculatorJsonLd(
  `CCD vs CMOS Sensor Comparison',
  description: 'Compare sensor architectures — SNR, dynamic range, and performance metrics.'
};


const jsonLd = generateCalculatorJsonLd(
  'CCD vs CMOS Sensor Comparison',
  'Compare sensor architectures — SNR, dynamic range, and performance metrics.',
  'https://photonics-calculators.vercel.app/detectors/ccd-vs-cmos',
  { category: 'Detectors`,
  `Compare sensor architectures — SNR, dynamic range, and performance metrics.'
};


const jsonLd = generateCalculatorJsonLd(
  'CCD vs CMOS Sensor Comparison',
  'Compare sensor architectures — SNR, dynamic range, and performance metrics.',
  'https://photonics-calculators.vercel.app/detectors/ccd-vs-cmos',
  { category: 'Detectors`,
  `https://photonics-calculators.vercel.app/detectors/ccd-vs-cmos`,
  { category: `Detectors` }
);
export default function Page() {
  return (
    <>
      <JsonLdScript data={jsonLd} />
      <PageClient />
    </>
  );
}

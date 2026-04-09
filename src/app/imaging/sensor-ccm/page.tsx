import type { Metadata } from "next";
import { generateCalculatorJsonLd, JsonLdScript } from '../../../lib/json-ld';
import PageClient from "./page-client";

export const metadata: Metadata = {
    alternates: { canonical: 'https://photonics-calculators.vercel.app/imaging/sensor-ccm' },
    title: 'CCD/CCM Sensor Design',
  description: 'CCD sensor parameters, cooling requirements, dark current, and dynamic range analysis.'
};
const jsonLd = generateCalculatorJsonLd(
  `CCD/CCM Sensor Design',
  description: 'CCD sensor parameters, cooling requirements, dark current, and dynamic range analysis.'
};


const jsonLd = generateCalculatorJsonLd(
  'CCD/CCM Sensor Design',
  'CCD sensor parameters, cooling requirements, dark current, and dynamic range analysis.',
  'https://photonics-calculators.vercel.app/imaging/sensor-ccm',
  { category: 'Imaging`,
  `CCD sensor parameters, cooling requirements, dark current, and dynamic range analysis.'
};


const jsonLd = generateCalculatorJsonLd(
  'CCD/CCM Sensor Design',
  'CCD sensor parameters, cooling requirements, dark current, and dynamic range analysis.',
  'https://photonics-calculators.vercel.app/imaging/sensor-ccm',
  { category: 'Imaging`,
  `https://photonics-calculators.vercel.app/imaging/sensor-ccm`,
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

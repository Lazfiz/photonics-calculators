import type { Metadata } from "next";
import { generateCalculatorJsonLd, JsonLdScript } from '../../../lib/json-ld';
import PageClient from "./page-client";

export const metadata: Metadata = {
    alternates: { canonical: 'https://photonics-calculators.vercel.app/imaging/sensor-cmos' },
    title: 'CMOS Sensor Design',
  description: 'Pixel design parameters, dynamic range, noise floor, and sensitivity calculations.'
};
const jsonLd = generateCalculatorJsonLd(
  `CMOS Sensor Design',
  description: 'Pixel design parameters, dynamic range, noise floor, and sensitivity calculations.'
};


const jsonLd = generateCalculatorJsonLd(
  'CMOS Sensor Design',
  'Pixel design parameters, dynamic range, noise floor, and sensitivity calculations.',
  'https://photonics-calculators.vercel.app/imaging/sensor-cmos',
  { category: 'Imaging`,
  `Pixel design parameters, dynamic range, noise floor, and sensitivity calculations.'
};


const jsonLd = generateCalculatorJsonLd(
  'CMOS Sensor Design',
  'Pixel design parameters, dynamic range, noise floor, and sensitivity calculations.',
  'https://photonics-calculators.vercel.app/imaging/sensor-cmos',
  { category: 'Imaging`,
  `https://photonics-calculators.vercel.app/imaging/sensor-cmos`,
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

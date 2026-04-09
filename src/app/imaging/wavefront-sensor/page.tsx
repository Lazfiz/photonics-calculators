import type { Metadata } from "next";
import { generateCalculatorJsonLd, JsonLdScript } from '../../../lib/json-ld';
import PageClient from "./page-client";

export const metadata: Metadata = {
    alternates: { canonical: 'https://photonics-calculators.vercel.app/imaging/wavefront-sensor' },
    title: 'Shack-Hartmann Wavefront Sensor Calculator',
  description: 'Design parameters for Shack-Hartmann wavefront sensors including spot size, sensitivity, and dynamic range.'
};
const jsonLd = generateCalculatorJsonLd(
  `Shack-Hartmann Wavefront Sensor Calculator',
  description: 'Design parameters for Shack-Hartmann wavefront sensors including spot size, sensitivity, and dynamic range.'
};


const jsonLd = generateCalculatorJsonLd(
  'Shack-Hartmann Wavefront Sensor Calculator',
  'Design parameters for Shack-Hartmann wavefront sensors including spot size, sensitivity, and dynamic range.',
  'https://photonics-calculators.vercel.app/imaging/wavefront-sensor',
  { category: 'Imaging`,
  `Design parameters for Shack-Hartmann wavefront sensors including spot size, sensitivity, and dynamic range.'
};


const jsonLd = generateCalculatorJsonLd(
  'Shack-Hartmann Wavefront Sensor Calculator',
  'Design parameters for Shack-Hartmann wavefront sensors including spot size, sensitivity, and dynamic range.',
  'https://photonics-calculators.vercel.app/imaging/wavefront-sensor',
  { category: 'Imaging`,
  `https://photonics-calculators.vercel.app/imaging/wavefront-sensor`,
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

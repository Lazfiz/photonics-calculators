import type { Metadata } from "next";
import { generateCalculatorJsonLd, JsonLdScript } from '../../../lib/json-ld';
import PageClient from "./page-client";

export const metadata: Metadata = {
    alternates: { canonical: 'https://photonics-calculators.vercel.app/materials/infrared-glass' },
    title: 'Infrared Optical Materials',
  description: 'Compare IR transmitting materials. n(T) = n₅ + (dn/dT)(T - 25°C)',
};
const jsonLd = generateCalculatorJsonLd(
  `Infrared Optical Materials',
  description: 'Compare IR transmitting materials. n(T) = n₅ + (dn/dT)(T - 25°C)',
};


const jsonLd = generateCalculatorJsonLd(
  'Infrared Optical Materials',
  'Compare IR transmitting materials. n(T) = n₅ + (dn/dT)(T - 25°C)',
  'https://photonics-calculators.vercel.app/materials/infrared-glass',
  { category: 'Materials`,
  `Compare IR transmitting materials. n(T) = n₅ + (dn/dT)(T - 25°C)',
};


const jsonLd = generateCalculatorJsonLd(
  'Infrared Optical Materials',
  'Compare IR transmitting materials. n(T) = n₅ + (dn/dT)(T - 25°C)',
  'https://photonics-calculators.vercel.app/materials/infrared-glass',
  { category: 'Materials`,
  `https://photonics-calculators.vercel.app/materials/infrared-glass`,
  { category: `Materials` }
);
export default function Page() {
  return (
    <>
      <JsonLdScript data={jsonLd} />
      <PageClient />
    </>
  );
}

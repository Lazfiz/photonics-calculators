import type { Metadata } from "next";
import { generateCalculatorJsonLd, JsonLdScript } from '../../../lib/json-ld';
import PageClient from "./page-client";

export const metadata: Metadata = {
    alternates: { canonical: 'https://photonics-calculators.vercel.app/materials/infrared-materials' },
    title: 'Infrared Materials',
  description: 'Ge, Si, ZnSe, chalcogenides — refractive index and properties for IR optics',
};
const jsonLd = generateCalculatorJsonLd(
  `Infrared Materials',
  description: 'Ge, Si, ZnSe, chalcogenides — refractive index and properties for IR optics',
};


const jsonLd = generateCalculatorJsonLd(
  'Infrared Materials',
  'Ge, Si, ZnSe, chalcogenides — refractive index and properties for IR optics',
  'https://photonics-calculators.vercel.app/materials/infrared-materials',
  { category: 'Materials`,
  `Ge, Si, ZnSe, chalcogenides — refractive index and properties for IR optics',
};


const jsonLd = generateCalculatorJsonLd(
  'Infrared Materials',
  'Ge, Si, ZnSe, chalcogenides — refractive index and properties for IR optics',
  'https://photonics-calculators.vercel.app/materials/infrared-materials',
  { category: 'Materials`,
  `https://photonics-calculators.vercel.app/materials/infrared-materials`,
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

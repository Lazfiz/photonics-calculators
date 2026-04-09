import type { Metadata } from "next";
import { generateCalculatorJsonLd, JsonLdScript } from '../../../lib/json-ld';
import PageClient from "./page-client";

export const metadata: Metadata = {
    alternates: { canonical: 'https://photonics-calculators.vercel.app/materials/chalcogenide-glass' },
    title: 'Chalcogenide Glass Properties',
  description: 'IR-transparent glasses for thermal imaging, sensing, and nonlinear optics',
};
const jsonLd = generateCalculatorJsonLd(
  `Chalcogenide Glass Properties',
  description: 'IR-transparent glasses for thermal imaging, sensing, and nonlinear optics',
};


const jsonLd = generateCalculatorJsonLd(
  'Chalcogenide Glass Properties',
  'IR-transparent glasses for thermal imaging, sensing, and nonlinear optics',
  'https://photonics-calculators.vercel.app/materials/chalcogenide-glass',
  { category: 'Materials`,
  `IR-transparent glasses for thermal imaging, sensing, and nonlinear optics',
};


const jsonLd = generateCalculatorJsonLd(
  'Chalcogenide Glass Properties',
  'IR-transparent glasses for thermal imaging, sensing, and nonlinear optics',
  'https://photonics-calculators.vercel.app/materials/chalcogenide-glass',
  { category: 'Materials`,
  `https://photonics-calculators.vercel.app/materials/chalcogenide-glass`,
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

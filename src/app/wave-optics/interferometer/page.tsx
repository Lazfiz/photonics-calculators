import type { Metadata } from "next";
import { generateCalculatorJsonLd, JsonLdScript } from '../../../lib/json-ld';
import PageClient from "./page-client";

export const metadata: Metadata = {
    alternates: { canonical: 'https://photonics-calculators.vercel.app/wave-optics/interferometer' },
    title: 'Interferometer Visibility',
  description: 'Michelson / Mach-Zehnder interferometer intensity vs path difference. Visibility limited by mirror reflectivity.'
};
const jsonLd = generateCalculatorJsonLd(
  `Interferometer Visibility',
  description: 'Michelson / Mach-Zehnder interferometer intensity vs path difference. Visibility limited by mirror reflectivity.'
};


const jsonLd = generateCalculatorJsonLd(
  'Interferometer Visibility',
  'Michelson / Mach-Zehnder interferometer intensity vs path difference. Visibility limited by mirror reflectivity.',
  'https://photonics-calculators.vercel.app/wave-optics/interferometer',
  { category: 'Wave Optics`,
  `Michelson / Mach-Zehnder interferometer intensity vs path difference. Visibility limited by mirror reflectivity.'
};


const jsonLd = generateCalculatorJsonLd(
  'Interferometer Visibility',
  'Michelson / Mach-Zehnder interferometer intensity vs path difference. Visibility limited by mirror reflectivity.',
  'https://photonics-calculators.vercel.app/wave-optics/interferometer',
  { category: 'Wave Optics`,
  `https://photonics-calculators.vercel.app/wave-optics/interferometer`,
  { category: `Wave Optics` }
);
export default function Page() {
  return (
    <>
      <JsonLdScript data={jsonLd} />
      <PageClient />
    </>
  );
}

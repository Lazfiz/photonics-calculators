import type { Metadata } from "next";
import { generateCalculatorJsonLd, JsonLdScript } from '../../../lib/json-ld';
import PageClient from "./page-client";

export const metadata: Metadata = {
    alternates: { canonical: 'https://photonics-calculators.vercel.app/spectroscopy/etalon-fsr' },
      title: 'Etalon Free Spectral Range',
  description: 'Fabry-Pérot etalon: FSR = ²/(2nd cos ). Transmission follows the Airy function.',
};
const jsonLd = generateCalculatorJsonLd(
  `Etalon Free Spectral Range',
  description: 'Fabry-Pérot etalon: FSR = ²/(2nd cos ). Transmission follows the Airy function.',
};


const jsonLd = generateCalculatorJsonLd(
  'Etalon Free Spectral Range',
  'Fabry-Pérot etalon: FSR = ²/(2nd cos ). Transmission follows the Airy function.',
  'https://photonics-calculators.vercel.app/spectroscopy/etalon-fsr',
  { category: 'Spectroscopy`,
  `Fabry-Pérot etalon: FSR = ²/(2nd cos ). Transmission follows the Airy function.',
};


const jsonLd = generateCalculatorJsonLd(
  'Etalon Free Spectral Range',
  'Fabry-Pérot etalon: FSR = ²/(2nd cos ). Transmission follows the Airy function.',
  'https://photonics-calculators.vercel.app/spectroscopy/etalon-fsr',
  { category: 'Spectroscopy`,
  `https://photonics-calculators.vercel.app/spectroscopy/etalon-fsr`,
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

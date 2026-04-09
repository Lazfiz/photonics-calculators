import type { Metadata } from "next";
import { generateCalculatorJsonLd, JsonLdScript } from '../../../lib/json-ld';
import PageClient from "./page-client";

export const metadata: Metadata = {
    alternates: { canonical: 'https://photonics-calculators.vercel.app/fiber-optics/fiber-optic-sensor' },
    title: 'Fiber Optic Sensors',
  description: 'Calculate sensitivity, resolution, and response for FBG, MZI, Fabry-Pérot, and evanescent fiber sensors.'
};
const jsonLd = generateCalculatorJsonLd(
  `Fiber Optic Sensors',
  description: 'Calculate sensitivity, resolution, and response for FBG, MZI, Fabry-Pérot, and evanescent fiber sensors.'
};


const jsonLd = generateCalculatorJsonLd(
  'Fiber Optic Sensors',
  'Calculate sensitivity, resolution, and response for FBG, MZI, Fabry-Pérot, and evanescent fiber sensors.',
  'https://photonics-calculators.vercel.app/fiber-optics/fiber-optic-sensor',
  { category: 'Fiber Optics`,
  `Calculate sensitivity, resolution, and response for FBG, MZI, Fabry-Pérot, and evanescent fiber sensors.'
};


const jsonLd = generateCalculatorJsonLd(
  'Fiber Optic Sensors',
  'Calculate sensitivity, resolution, and response for FBG, MZI, Fabry-Pérot, and evanescent fiber sensors.',
  'https://photonics-calculators.vercel.app/fiber-optics/fiber-optic-sensor',
  { category: 'Fiber Optics`,
  `https://photonics-calculators.vercel.app/fiber-optics/fiber-optic-sensor`,
  { category: `Fiber Optics` }
);
export default function Page() {
  return (
    <>
      <JsonLdScript data={jsonLd} />
      <PageClient />
    </>
  );
}

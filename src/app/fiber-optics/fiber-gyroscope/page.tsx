import type { Metadata } from "next";
import { generateCalculatorJsonLd, JsonLdScript } from '../../../lib/json-ld';
import PageClient from "./page-client";

export const metadata: Metadata = {
    alternates: { canonical: 'https://photonics-calculators.vercel.app/fiber-optics/fiber-gyroscope' },
    title: 'Fiber Optic Gyroscope (FOG)',
  description: 'Sagnac effect, scale factor, angle random walk, and bias stability for fiber optic gyroscopes.'
};
const jsonLd = generateCalculatorJsonLd(
  `Fiber Optic Gyroscope (FOG)',
  description: 'Sagnac effect, scale factor, angle random walk, and bias stability for fiber optic gyroscopes.'
};


const jsonLd = generateCalculatorJsonLd(
  'Fiber Optic Gyroscope (FOG)',
  'Sagnac effect, scale factor, angle random walk, and bias stability for fiber optic gyroscopes.',
  'https://photonics-calculators.vercel.app/fiber-optics/fiber-gyroscope',
  { category: 'Fiber Optics`,
  `Sagnac effect, scale factor, angle random walk, and bias stability for fiber optic gyroscopes.'
};


const jsonLd = generateCalculatorJsonLd(
  'Fiber Optic Gyroscope (FOG)',
  'Sagnac effect, scale factor, angle random walk, and bias stability for fiber optic gyroscopes.',
  'https://photonics-calculators.vercel.app/fiber-optics/fiber-gyroscope',
  { category: 'Fiber Optics`,
  `https://photonics-calculators.vercel.app/fiber-optics/fiber-gyroscope`,
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

import type { Metadata } from "next";
import { generateCalculatorJsonLd, JsonLdScript } from '../../../lib/json-ld';
import PageClient from "./page-client";

export const metadata: Metadata = {
    alternates: { canonical: 'https://photonics-calculators.vercel.app/fiber-optics/attenuation' },
    title: 'Wavelength-Dependent Attenuation',
  description: 'Fiber attenuation spectrum showing Rayleigh scattering, IR absorption, and OH peak for standard fiber types.'
};
const jsonLd = generateCalculatorJsonLd(
  `Wavelength-Dependent Attenuation',
  description: 'Fiber attenuation spectrum showing Rayleigh scattering, IR absorption, and OH peak for standard fiber types.'
};


const jsonLd = generateCalculatorJsonLd(
  'Wavelength-Dependent Attenuation',
  'Fiber attenuation spectrum showing Rayleigh scattering, IR absorption, and OH peak for standard fiber types.',
  'https://photonics-calculators.vercel.app/fiber-optics/attenuation',
  { category: 'Fiber Optics`,
  `Fiber attenuation spectrum showing Rayleigh scattering, IR absorption, and OH peak for standard fiber types.'
};


const jsonLd = generateCalculatorJsonLd(
  'Wavelength-Dependent Attenuation',
  'Fiber attenuation spectrum showing Rayleigh scattering, IR absorption, and OH peak for standard fiber types.',
  'https://photonics-calculators.vercel.app/fiber-optics/attenuation',
  { category: 'Fiber Optics`,
  `https://photonics-calculators.vercel.app/fiber-optics/attenuation`,
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

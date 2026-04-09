import type { Metadata } from "next";
import { generateCalculatorJsonLd, JsonLdScript } from '../../../lib/json-ld';
import PageClient from "./page-client";

export const metadata: Metadata = {
    alternates: { canonical: 'https://photonics-calculators.vercel.app/laser-safety/atmospheric-attenuation' },
    title: 'Atmospheric Attenuation',
  description: 'Calculates atmospheric beam attenuation using Beer-Lambert law with water vapor absorption, CO absorption, Rayleigh and Mie scattering. Useful for outdoor laser safety NOHD calculations.'
};
const jsonLd = generateCalculatorJsonLd(
  `Atmospheric Attenuation',
  description: 'Calculates atmospheric beam attenuation using Beer-Lambert law with water vapor absorption, CO absorption, Rayleigh and Mie scattering. Useful for outdoor laser safety NOHD calculations.'
};


const jsonLd = generateCalculatorJsonLd(
  'Atmospheric Attenuation',
  'Calculates atmospheric beam attenuation using Beer-Lambert law with water vapor absorption, CO absorption, Rayleigh and Mie scattering. Useful for outdoor laser safety NOHD calculations.',
  'https://photonics-calculators.vercel.app/laser-safety/atmospheric-attenuation',
  { category: 'Laser Safety`,
  `Calculates atmospheric beam attenuation using Beer-Lambert law with water vapor absorption, CO absorption, Rayleigh and Mie scattering. Useful for outdoor laser safety NOHD calculations.'
};


const jsonLd = generateCalculatorJsonLd(
  'Atmospheric Attenuation',
  'Calculates atmospheric beam attenuation using Beer-Lambert law with water vapor absorption, CO absorption, Rayleigh and Mie scattering. Useful for outdoor laser safety NOHD calculations.',
  'https://photonics-calculators.vercel.app/laser-safety/atmospheric-attenuation',
  { category: 'Laser Safety`,
  `https://photonics-calculators.vercel.app/laser-safety/atmospheric-attenuation`,
  { category: `Laser Safety` }
);
export default function Page() {
  return (
    <>
      <JsonLdScript data={jsonLd} />
      <PageClient />
    </>
  );
}

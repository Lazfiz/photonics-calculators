import type { Metadata } from "next";
import { generateCalculatorJsonLd, JsonLdScript } from '../../../lib/json-ld';
import PageClient from "./page-client";

export const metadata: Metadata = {
    alternates: { canonical: 'https://photonics-calculators.vercel.app/imaging/pixel-fov' },
    title: 'Pixel Field of View',
  description: 'Calculate the angular field of view per pixel from pixel size and focal length.'
};
const jsonLd = generateCalculatorJsonLd(
  `Pixel Field of View',
  description: 'Calculate the angular field of view per pixel from pixel size and focal length.'
};


const jsonLd = generateCalculatorJsonLd(
  'Pixel Field of View',
  'Calculate the angular field of view per pixel from pixel size and focal length.',
  'https://photonics-calculators.vercel.app/imaging/pixel-fov',
  { category: 'Imaging`,
  `Calculate the angular field of view per pixel from pixel size and focal length.'
};


const jsonLd = generateCalculatorJsonLd(
  'Pixel Field of View',
  'Calculate the angular field of view per pixel from pixel size and focal length.',
  'https://photonics-calculators.vercel.app/imaging/pixel-fov',
  { category: 'Imaging`,
  `https://photonics-calculators.vercel.app/imaging/pixel-fov`,
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

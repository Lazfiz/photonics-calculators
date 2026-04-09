import type { Metadata } from "next";
import { generateCalculatorJsonLd, JsonLdScript } from '../../../lib/json-ld';
import PageClient from "./page-client";

export const metadata: Metadata = {
    alternates: { canonical: 'https://photonics-calculators.vercel.app/laser-safety/lidar-safety' },
    title: 'LiDAR Laser Safety Calculator',
  description: 'Analyze pulse energy, PRF-corrected MPE, and NOHD for LiDAR systems (905/1550 nm).',
};
const jsonLd = generateCalculatorJsonLd(
  `LiDAR Laser Safety Calculator',
  description: 'Analyze pulse energy, PRF-corrected MPE, and NOHD for LiDAR systems (905/1550 nm).',
};


const jsonLd = generateCalculatorJsonLd(
  'LiDAR Laser Safety Calculator',
  'Analyze pulse energy, PRF-corrected MPE, and NOHD for LiDAR systems (905/1550 nm).',
  'https://photonics-calculators.vercel.app/laser-safety/lidar-safety',
  { category: 'Laser Safety`,
  `Analyze pulse energy, PRF-corrected MPE, and NOHD for LiDAR systems (905/1550 nm).',
};


const jsonLd = generateCalculatorJsonLd(
  'LiDAR Laser Safety Calculator',
  'Analyze pulse energy, PRF-corrected MPE, and NOHD for LiDAR systems (905/1550 nm).',
  'https://photonics-calculators.vercel.app/laser-safety/lidar-safety',
  { category: 'Laser Safety`,
  `https://photonics-calculators.vercel.app/laser-safety/lidar-safety`,
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

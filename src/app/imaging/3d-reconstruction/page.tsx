import type { Metadata } from "next";
import { generateCalculatorJsonLd, JsonLdScript } from '../../../lib/json-ld';
import PageClient from "./page-client";

export const metadata: Metadata = {
    alternates: { canonical: 'https://photonics-calculators.vercel.app/imaging/3d-reconstruction' },
    title: '3D Reconstruction Methods',
  description: 'Compare 3D reconstruction approaches: resolution, sampling, voxel budgets, and method tradeoffs.'
};
const jsonLd = generateCalculatorJsonLd(
  `3D Reconstruction Methods',
  description: 'Compare 3D reconstruction approaches: resolution, sampling, voxel budgets, and method tradeoffs.'
};


const jsonLd = generateCalculatorJsonLd(
  '3D Reconstruction Methods',
  'Compare 3D reconstruction approaches: resolution, sampling, voxel budgets, and method tradeoffs.',
  'https://photonics-calculators.vercel.app/imaging/3d-reconstruction',
  { category: 'Imaging`,
  `Compare 3D reconstruction approaches: resolution, sampling, voxel budgets, and method tradeoffs.'
};


const jsonLd = generateCalculatorJsonLd(
  '3D Reconstruction Methods',
  'Compare 3D reconstruction approaches: resolution, sampling, voxel budgets, and method tradeoffs.',
  'https://photonics-calculators.vercel.app/imaging/3d-reconstruction',
  { category: 'Imaging`,
  `https://photonics-calculators.vercel.app/imaging/3d-reconstruction`,
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

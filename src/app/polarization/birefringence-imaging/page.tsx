import type { Metadata } from "next";
import { generateCalculatorJsonLd, JsonLdScript } from '../../../lib/json-ld';
import PageClient from "./page-client";

export const metadata: Metadata = {
    alternates: { canonical: 'https://photonics-calculators.vercel.app/polarization/birefringence-imaging' },
    title: 'Birefringence Imaging',
  description: 'Simulate quantitative birefringence imaging with polarizer/analyzer rotation and compensators. Visualize stress-induced birefringence patterns.'
};
const jsonLd = generateCalculatorJsonLd(
  `Birefringence Imaging',
  description: 'Simulate quantitative birefringence imaging with polarizer/analyzer rotation and compensators. Visualize stress-induced birefringence patterns.'
};


const jsonLd = generateCalculatorJsonLd(
  'Birefringence Imaging',
  'Simulate quantitative birefringence imaging with polarizer/analyzer rotation and compensators. Visualize stress-induced birefringence patterns.',
  'https://photonics-calculators.vercel.app/polarization/birefringence-imaging',
  { category: 'Polarization`,
  `Simulate quantitative birefringence imaging with polarizer/analyzer rotation and compensators. Visualize stress-induced birefringence patterns.'
};


const jsonLd = generateCalculatorJsonLd(
  'Birefringence Imaging',
  'Simulate quantitative birefringence imaging with polarizer/analyzer rotation and compensators. Visualize stress-induced birefringence patterns.',
  'https://photonics-calculators.vercel.app/polarization/birefringence-imaging',
  { category: 'Polarization`,
  `https://photonics-calculators.vercel.app/polarization/birefringence-imaging`,
  { category: `Polarization` }
);
export default function Page() {
  return (
    <>
      <JsonLdScript data={jsonLd} />
      <PageClient />
    </>
  );
}

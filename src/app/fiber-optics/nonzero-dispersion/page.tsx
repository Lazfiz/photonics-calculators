import type { Metadata } from "next";
import { generateCalculatorJsonLd, JsonLdScript } from '../../../lib/json-ld';
import PageClient from "./page-client";

export const metadata: Metadata = {
    alternates: { canonical: 'https://photonics-calculators.vercel.app/fiber-optics/nonzero-dispersion' },
    title: 'Non-Zero Dispersion Shifted Fiber (NZ-DSF)',
  description: 'Design NZ-DSF fibers (G.655) with optimized dispersion for DWDM systems — balancing dispersion and nonlinearity.'
};
const jsonLd = generateCalculatorJsonLd(
  `Non-Zero Dispersion Shifted Fiber (NZ-DSF)',
  description: 'Design NZ-DSF fibers (G.655) with optimized dispersion for DWDM systems — balancing dispersion and nonlinearity.'
};


const jsonLd = generateCalculatorJsonLd(
  'Non-Zero Dispersion Shifted Fiber (NZ-DSF)',
  'Design NZ-DSF fibers (G.655) with optimized dispersion for DWDM systems — balancing dispersion and nonlinearity.',
  'https://photonics-calculators.vercel.app/fiber-optics/nonzero-dispersion',
  { category: 'Fiber Optics`,
  `Design NZ-DSF fibers (G.655) with optimized dispersion for DWDM systems — balancing dispersion and nonlinearity.'
};


const jsonLd = generateCalculatorJsonLd(
  'Non-Zero Dispersion Shifted Fiber (NZ-DSF)',
  'Design NZ-DSF fibers (G.655) with optimized dispersion for DWDM systems — balancing dispersion and nonlinearity.',
  'https://photonics-calculators.vercel.app/fiber-optics/nonzero-dispersion',
  { category: 'Fiber Optics`,
  `https://photonics-calculators.vercel.app/fiber-optics/nonzero-dispersion`,
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

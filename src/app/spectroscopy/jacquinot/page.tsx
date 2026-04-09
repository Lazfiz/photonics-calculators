import type { Metadata } from "next";
import { generateCalculatorJsonLd, JsonLdScript } from '../../../lib/json-ld';
import PageClient from "./page-client";

export const metadata: Metadata = {
    alternates: { canonical: 'https://photonics-calculators.vercel.app/spectroscopy/jacquinot' },
      title: 'Jacquinot Advantage',
  description: 'FTIR throughput advantage over dispersive instruments. G = 2/(̃2L) where L = max OPD.',
};
const jsonLd = generateCalculatorJsonLd(
  `Jacquinot Advantage',
  description: 'FTIR throughput advantage over dispersive instruments. G = 2/(̃2L) where L = max OPD.',
};


const jsonLd = generateCalculatorJsonLd(
  'Jacquinot Advantage',
  'FTIR throughput advantage over dispersive instruments. G = 2/(̃2L) where L = max OPD.',
  'https://photonics-calculators.vercel.app/spectroscopy/jacquinot',
  { category: 'Spectroscopy`,
  `FTIR throughput advantage over dispersive instruments. G = 2/(̃2L) where L = max OPD.',
};


const jsonLd = generateCalculatorJsonLd(
  'Jacquinot Advantage',
  'FTIR throughput advantage over dispersive instruments. G = 2/(̃2L) where L = max OPD.',
  'https://photonics-calculators.vercel.app/spectroscopy/jacquinot',
  { category: 'Spectroscopy`,
  `https://photonics-calculators.vercel.app/spectroscopy/jacquinot`,
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

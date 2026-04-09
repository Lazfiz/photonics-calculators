import type { Metadata } from "next";
import { generateCalculatorJsonLd, JsonLdScript } from '../../../lib/json-ld';
import PageClient from "./page-client";

export const metadata: Metadata = {
    alternates: { canonical: 'https://photonics-calculators.vercel.app/materials/two-photon-absorption' },
    title: 'Two-Photon Absorption',
  description: 'Nonlinear absorption coefficient PA and intensity-dependent transmission. TPA becomes significant at high peak intensities (pulsed lasers).',
};
const jsonLd = generateCalculatorJsonLd(
  `Two-Photon Absorption',
  description: 'Nonlinear absorption coefficient PA and intensity-dependent transmission. TPA becomes significant at high peak intensities (pulsed lasers).',
};


const jsonLd = generateCalculatorJsonLd(
  'Two-Photon Absorption',
  'Nonlinear absorption coefficient PA and intensity-dependent transmission. TPA becomes significant at high peak intensities (pulsed lasers).',
  'https://photonics-calculators.vercel.app/materials/two-photon-absorption',
  { category: 'Materials`,
  `Nonlinear absorption coefficient PA and intensity-dependent transmission. TPA becomes significant at high peak intensities (pulsed lasers).',
};


const jsonLd = generateCalculatorJsonLd(
  'Two-Photon Absorption',
  'Nonlinear absorption coefficient PA and intensity-dependent transmission. TPA becomes significant at high peak intensities (pulsed lasers).',
  'https://photonics-calculators.vercel.app/materials/two-photon-absorption',
  { category: 'Materials`,
  `https://photonics-calculators.vercel.app/materials/two-photon-absorption`,
  { category: `Materials` }
);
export default function Page() {
  return (
    <>
      <JsonLdScript data={jsonLd} />
      <PageClient />
    </>
  );
}

import type { Metadata } from "next";
import { generateCalculatorJsonLd, JsonLdScript } from '../../../lib/json-ld';
import PageClient from "./page-client";

export const metadata: Metadata = {
    alternates: { canonical: 'https://photonics-calculators.vercel.app/fiber-optics/nonlinear-effects' },
    title: 'Nonlinear Effects in Fiber',
  description: 'Calculate SPM, XPM, FWM penalties, SBS/SRS thresholds, and nonlinear phase shift.'
};
const jsonLd = generateCalculatorJsonLd(
  `Nonlinear Effects in Fiber',
  description: 'Calculate SPM, XPM, FWM penalties, SBS/SRS thresholds, and nonlinear phase shift.'
};


const jsonLd = generateCalculatorJsonLd(
  'Nonlinear Effects in Fiber',
  'Calculate SPM, XPM, FWM penalties, SBS/SRS thresholds, and nonlinear phase shift.',
  'https://photonics-calculators.vercel.app/fiber-optics/nonlinear-effects',
  { category: 'Fiber Optics`,
  `Calculate SPM, XPM, FWM penalties, SBS/SRS thresholds, and nonlinear phase shift.'
};


const jsonLd = generateCalculatorJsonLd(
  'Nonlinear Effects in Fiber',
  'Calculate SPM, XPM, FWM penalties, SBS/SRS thresholds, and nonlinear phase shift.',
  'https://photonics-calculators.vercel.app/fiber-optics/nonlinear-effects',
  { category: 'Fiber Optics`,
  `https://photonics-calculators.vercel.app/fiber-optics/nonlinear-effects`,
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

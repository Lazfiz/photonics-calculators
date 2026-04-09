import type { Metadata } from "next";
import { generateCalculatorJsonLd, JsonLdScript } from '../../../lib/json-ld';
import PageClient from "./page-client";

export const metadata: Metadata = {
    alternates: { canonical: 'https://photonics-calculators.vercel.app/imaging/optical-sectioning-thickness' },
    title: 'Optical Sectioning Thickness Calculator',
  description: 'Compare optical sectioning capability across widefield, confocal, and multiphoton microscopy techniques.'
};
const jsonLd = generateCalculatorJsonLd(
  `Optical Sectioning Thickness Calculator',
  description: 'Compare optical sectioning capability across widefield, confocal, and multiphoton microscopy techniques.'
};


const jsonLd = generateCalculatorJsonLd(
  'Optical Sectioning Thickness Calculator',
  'Compare optical sectioning capability across widefield, confocal, and multiphoton microscopy techniques.',
  'https://photonics-calculators.vercel.app/imaging/optical-sectioning-thickness',
  { category: 'Imaging`,
  `Compare optical sectioning capability across widefield, confocal, and multiphoton microscopy techniques.'
};


const jsonLd = generateCalculatorJsonLd(
  'Optical Sectioning Thickness Calculator',
  'Compare optical sectioning capability across widefield, confocal, and multiphoton microscopy techniques.',
  'https://photonics-calculators.vercel.app/imaging/optical-sectioning-thickness',
  { category: 'Imaging`,
  `https://photonics-calculators.vercel.app/imaging/optical-sectioning-thickness`,
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

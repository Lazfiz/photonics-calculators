import type { Metadata } from "next";
import { generateCalculatorJsonLd, JsonLdScript } from '../../../lib/json-ld';
import PageClient from "./page-client";

export const metadata: Metadata = {
    alternates: { canonical: 'https://photonics-calculators.vercel.app/fiber-optics/low-water-peak' },
    title: 'Low Water Peak Fiber',
  description: 'Analyze low water peak (LWP) fibers that reduce the OH⁻ absorption peak at 1383 nm, enabling E-band and full CWDM operation.'
};
const jsonLd = generateCalculatorJsonLd(
  `Low Water Peak Fiber',
  description: 'Analyze low water peak (LWP) fibers that reduce the OH⁻ absorption peak at 1383 nm, enabling E-band and full CWDM operation.'
};


const jsonLd = generateCalculatorJsonLd(
  'Low Water Peak Fiber',
  'Analyze low water peak (LWP) fibers that reduce the OH⁻ absorption peak at 1383 nm, enabling E-band and full CWDM operation.',
  'https://photonics-calculators.vercel.app/fiber-optics/low-water-peak',
  { category: 'Fiber Optics`,
  `Analyze low water peak (LWP) fibers that reduce the OH⁻ absorption peak at 1383 nm, enabling E-band and full CWDM operation.'
};


const jsonLd = generateCalculatorJsonLd(
  'Low Water Peak Fiber',
  'Analyze low water peak (LWP) fibers that reduce the OH⁻ absorption peak at 1383 nm, enabling E-band and full CWDM operation.',
  'https://photonics-calculators.vercel.app/fiber-optics/low-water-peak',
  { category: 'Fiber Optics`,
  `https://photonics-calculators.vercel.app/fiber-optics/low-water-peak`,
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

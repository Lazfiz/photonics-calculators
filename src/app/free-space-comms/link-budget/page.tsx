import type { Metadata } from "next";
import { generateCalculatorJsonLd, JsonLdScript } from '../../../lib/json-ld';
import PageClient from "./page-client";

export const metadata: Metadata = {
    alternates: { canonical: 'https://photonics-calculators.vercel.app/free-space-comms/link-budget' },
    title: 'FSO Link Budget',
  description: 'Interactive free-space optical link budget with sliders, presets, and received-power versus range view.'
};
const jsonLd = generateCalculatorJsonLd(
  `FSO Link Budget',
  description: 'Interactive free-space optical link budget with sliders, presets, and received-power versus range view.'
};


const jsonLd = generateCalculatorJsonLd(
  'FSO Link Budget',
  'Interactive free-space optical link budget with sliders, presets, and received-power versus range view.',
  'https://photonics-calculators.vercel.app/free-space-comms/link-budget',
  { category: 'Free Space Comms`,
  `Interactive free-space optical link budget with sliders, presets, and received-power versus range view.'
};


const jsonLd = generateCalculatorJsonLd(
  'FSO Link Budget',
  'Interactive free-space optical link budget with sliders, presets, and received-power versus range view.',
  'https://photonics-calculators.vercel.app/free-space-comms/link-budget',
  { category: 'Free Space Comms`,
  `https://photonics-calculators.vercel.app/free-space-comms/link-budget`,
  { category: `Free Space Comms` }
);
export default function Page() {
  return (
    <>
      <JsonLdScript data={jsonLd} />
      <PageClient />
    </>
  );
}

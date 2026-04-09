import type { Metadata } from "next";
import { generateCalculatorJsonLd, JsonLdScript } from '../../../lib/json-ld';
import PageClient from "./page-client";

export const metadata: Metadata = {
    alternates: { canonical: 'https://photonics-calculators.vercel.app/materials/uv-materials' },
      title: 'UV Optical Materials',
  description: 'Deep UV to near-UV materials comparison. Sellmeier: n² = 1 + Σ Bi²/(² - Ci)',
};
const jsonLd = generateCalculatorJsonLd(
  `UV Optical Materials',
  description: 'Deep UV to near-UV materials comparison. Sellmeier: n² = 1 + Σ Bi²/(² - Ci)',
};


const jsonLd = generateCalculatorJsonLd(
  'UV Optical Materials',
  'Deep UV to near-UV materials comparison. Sellmeier: n² = 1 + Σ Bi²/(² - Ci)',
  'https://photonics-calculators.vercel.app/materials/uv-materials',
  { category: 'Materials`,
  `Deep UV to near-UV materials comparison. Sellmeier: n² = 1 + Σ Bi²/(² - Ci)',
};


const jsonLd = generateCalculatorJsonLd(
  'UV Optical Materials',
  'Deep UV to near-UV materials comparison. Sellmeier: n² = 1 + Σ Bi²/(² - Ci)',
  'https://photonics-calculators.vercel.app/materials/uv-materials',
  { category: 'Materials`,
  `https://photonics-calculators.vercel.app/materials/uv-materials`,
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

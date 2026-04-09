import type { Metadata } from "next";
import { generateCalculatorJsonLd, JsonLdScript } from '../../../lib/json-ld';
import PageClient from "./page-client";

export const metadata: Metadata = {
    alternates: { canonical: 'https://photonics-calculators.vercel.app/detectors/dark-current' },
      title: 'Dark Current vs Temperature',
  description: 'Silicon detector dark current — exponential doubling model. I_dark(T) = I₀ 2^((T−T₀)/T_d).',
};
const jsonLd = generateCalculatorJsonLd(
  `Dark Current vs Temperature',
  description: 'Silicon detector dark current — exponential doubling model. I_dark(T) = I₀ 2^((T−T₀)/T_d).',
};


const jsonLd = generateCalculatorJsonLd(
  'Dark Current vs Temperature',
  'Silicon detector dark current — exponential doubling model. I_dark(T) = I₀ 2^((T−T₀)/T_d).',
  'https://photonics-calculators.vercel.app/detectors/dark-current',
  { category: 'Detectors`,
  `Silicon detector dark current — exponential doubling model. I_dark(T) = I₀ 2^((T−T₀)/T_d).',
};


const jsonLd = generateCalculatorJsonLd(
  'Dark Current vs Temperature',
  'Silicon detector dark current — exponential doubling model. I_dark(T) = I₀ 2^((T−T₀)/T_d).',
  'https://photonics-calculators.vercel.app/detectors/dark-current',
  { category: 'Detectors`,
  `https://photonics-calculators.vercel.app/detectors/dark-current`,
  { category: `Detectors` }
);
export default function Page() {
  return (
    <>
      <JsonLdScript data={jsonLd} />
      <PageClient />
    </>
  );
}

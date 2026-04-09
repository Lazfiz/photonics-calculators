import type { Metadata } from "next";
import { generateCalculatorJsonLd, JsonLdScript } from '../../../lib/json-ld';
import PageClient from "./page-client";

export const metadata: Metadata = {
    alternates: { canonical: 'https://photonics-calculators.vercel.app/thin-film/thermal-evaporation' },
    title: 'Thermal Evaporation',
  description: 'Model thermal evaporation: vapor pressure, deposition rate, mean free path, and film uniformity using Hertz-Knudsen and Clausius-Clapeyron equations.'
};
const jsonLd = generateCalculatorJsonLd(
  `Thermal Evaporation',
  description: 'Model thermal evaporation: vapor pressure, deposition rate, mean free path, and film uniformity using Hertz-Knudsen and Clausius-Clapeyron equations.'
};


const jsonLd = generateCalculatorJsonLd(
  'Thermal Evaporation',
  'Model thermal evaporation: vapor pressure, deposition rate, mean free path, and film uniformity using Hertz-Knudsen and Clausius-Clapeyron equations.',
  'https://photonics-calculators.vercel.app/thin-film/thermal-evaporation',
  { category: 'Thin Film`,
  `Model thermal evaporation: vapor pressure, deposition rate, mean free path, and film uniformity using Hertz-Knudsen and Clausius-Clapeyron equations.'
};


const jsonLd = generateCalculatorJsonLd(
  'Thermal Evaporation',
  'Model thermal evaporation: vapor pressure, deposition rate, mean free path, and film uniformity using Hertz-Knudsen and Clausius-Clapeyron equations.',
  'https://photonics-calculators.vercel.app/thin-film/thermal-evaporation',
  { category: 'Thin Film`,
  `https://photonics-calculators.vercel.app/thin-film/thermal-evaporation`,
  { category: `Thin Film` }
);
export default function Page() {
  return (
    <>
      <JsonLdScript data={jsonLd} />
      <PageClient />
    </>
  );
}

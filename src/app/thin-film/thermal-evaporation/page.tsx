import type { Metadata } from "next";
import PageClient from "./page-client";

export const metadata: Metadata = {
    alternates: { canonical: 'https://photonics-calculators.vercel.app/thin-film/thermal-evaporation' },
    title: 'Thermal Evaporation',
  description: 'Model thermal evaporation: vapor pressure, deposition rate, mean free path, and film uniformity using Hertz-Knudsen and Clausius-Clapeyron equations.'
};

export default function Page() {
  return <PageClient />;
}

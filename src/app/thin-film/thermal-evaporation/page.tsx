import type { Metadata } from "next";
import PageClient from "./page-client";

export const metadata: Metadata = {
    title: 'Thermal Evaporation',
  description: 'Model thermal evaporation: vapor pressure, deposition rate, mean free path, and film uniformity using Hertz-Knudsen and Clausius-Clapeyron equations.'
};

export default function Page() {
  return <PageClient />;
}

import type { Metadata } from "next";
import PageClient from "./page-client";

export const metadata: Metadata = {
    canonical: "https://photonics-calculators.vercel.app/materials/abbe-number",
    title: 'Abbe Number (Vd)',
  description: 'Calculate Abbe number from Sellmeier coefficients. Vd = (nD - 1)/(nF - nC).',
};

export default function Page() {
  return <PageClient />;
}

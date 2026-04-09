import type { Metadata } from "next";
import PageClient from "./page-client";

export const metadata: Metadata = {
    canonical: "https://photonics-calculators.vercel.app/materials/calcite-properties",
    title: 'Calcite (CaCO₃) Properties',
  description: 'Uniaxial negative crystal with the largest birefringence of common optical crystals. n 0.172 at 589nm.'
};

export default function Page() {
  return <PageClient />;
}

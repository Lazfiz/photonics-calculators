import type { Metadata } from "next";
import PageClient from "./page-client";

export const metadata: Metadata = {
    canonical: "https://photonics-calculators.vercel.app/materials/electro-optic",
    title: 'Electro-Optic Coefficients',
  description: 'Pockels effect materials for modulators, Q-switches, and phase shifters',
};

export default function Page() {
  return <PageClient />;
}

import type { Metadata } from "next";
import PageClient from "./page-client";

export const metadata: Metadata = {
    alternates: { canonical: 'https://photonics-calculators.vercel.app/materials/nonlinear-crystals' },
    title: 'Nonlinear Crystal Comparison',
  description: 'SHG, OPO, and frequency conversion crystal properties',
};

export default function Page() {
  return <PageClient />;
}

import type { Metadata } from "next";
import PageClient from "./page-client";

export const metadata: Metadata = {
    alternates: { canonical: 'https://photonics-calculators.vercel.app/laser-safety/beam-divergence-hazards' },
    title: 'Beam Divergence Hazards',
  description: 'Model Gaussian beam propagation and hazard distance based on beam divergence and MPE limits.'
};

export default function Page() {
  return <PageClient />;
}

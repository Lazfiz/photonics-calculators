import type { Metadata } from "next";
import PageClient from "./page-client";

export const metadata: Metadata = {
    canonical: "https://photonics-calculators.vercel.app/laser-safety/prf-correction",
    title: 'PRF Correction Factor',
  description: 'Calculates the repetitive-pulse correction factor Cp for pulsed laser MPE per ANSI Z136.1 §8.'
};

export default function Page() {
  return <PageClient />;
}

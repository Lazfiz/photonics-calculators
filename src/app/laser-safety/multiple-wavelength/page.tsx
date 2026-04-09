import type { Metadata } from "next";
import PageClient from "./page-client";

export const metadata: Metadata = {
    alternates: { canonical: 'https://photonics-calculators.vercel.app/laser-safety/multiple-wavelength' },
      title: 'Multiple Wavelength MPE',
  description: 'Calculates additive hazard ratios for multiple laser wavelengths. Sum of ratios must be < 1 for safety per ANSI Z136.1 Section 8.',
};

export default function Page() {
  return <PageClient />;
}

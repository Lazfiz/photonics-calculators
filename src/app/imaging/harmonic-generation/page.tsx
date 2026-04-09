import type { Metadata } from "next";
import PageClient from "./page-client";

export const metadata: Metadata = {
    canonical: "https://photonics-calculators.vercel.app/imaging/harmonic-generation",
    title: 'Harmonic Generation Microscopy Calculator',
  description: 'Calculate harmonic wavelengths, peak intensities, and conversion efficiencies for nonlinear harmonic generation microscopy.'
};

export default function Page() {
  return <PageClient />;
}

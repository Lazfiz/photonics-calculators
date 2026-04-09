import type { Metadata } from "next";
import PageClient from "./page-client";

export const metadata: Metadata = {
    alternates: { canonical: 'https://photonics-calculators.vercel.app/imaging/sum-frequency-microscopy' },
    title: 'Sum-Frequency Generation Microscopy Calculator',
  description: 'Calculate SFG wavelengths, energies, and beam parameters for sum-frequency generation microscopy.'
};

export default function Page() {
  return <PageClient />;
}

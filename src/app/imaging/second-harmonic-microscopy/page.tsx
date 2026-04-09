import type { Metadata } from "next";
import PageClient from "./page-client";

export const metadata: Metadata = {
    canonical: "https://photonics-calculators.vercel.app/imaging/second-harmonic-microscopy",
    title: 'Second-Harmonic Generation Microscopy Calculator',
  description: 'Calculate SHG wavelength, resolution, phase matching, and signal strength for SHG microscopy of collagen, muscle, and other non-centrosymmetric structures.'
};

export default function Page() {
  return <PageClient />;
}

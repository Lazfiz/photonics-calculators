import type { Metadata } from "next";
import PageClient from "./page-client";

export const metadata: Metadata = {
    canonical: "https://photonics-calculators.vercel.app/imaging/coherent-raman-microscopy",
    title: 'Coherent Raman Microscopy Calculator',
  description: 'Calculate Stokes wavelengths, spectral resolution, and spatial resolution for CARS and SRS microscopy.'
};

export default function Page() {
  return <PageClient />;
}

import type { Metadata } from "next";
import PageClient from "./page-client";

export const metadata: Metadata = {
    canonical: "https://photonics-calculators.vercel.app/spectroscopy/spectral-range",
    title: 'Spectral Range Calculator',
  description: 'Spectral coverage, resolution, and dispersion for a grating-based spectrometer.'
};

export default function Page() {
  return <PageClient />;
}

import type { Metadata } from "next";
import PageClient from "./page-client";

export const metadata: Metadata = {
    canonical: "https://photonics-calculators.vercel.app/spectroscopy/resolution",
    title: 'Spectral Resolution',
  description: 'Resolving power and minimum resolvable wavelength for a diffraction grating spectrometer.'
};

export default function Page() {
  return <PageClient />;
}

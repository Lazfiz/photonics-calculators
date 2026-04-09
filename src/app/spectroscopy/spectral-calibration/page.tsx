import type { Metadata } from "next";
import PageClient from "./page-client";

export const metadata: Metadata = {
    canonical: "https://photonics-calculators.vercel.app/spectroscopy/spectral-calibration",
    title: 'Spectral Calibration',
  description: 'Wavelength calibration using known emission lines and linear/polynomial fitting.'
};

export default function Page() {
  return <PageClient />;
}

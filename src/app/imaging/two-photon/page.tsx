import type { Metadata } from "next";
import PageClient from "./page-client";

export const metadata: Metadata = {
    canonical: "https://photonics-calculators.vercel.app/imaging/two-photon",
    title: 'Two-Photon Microscopy Calculator',
  description: 'Excitation wavelength, resolution, and pulse parameters for two-photon fluorescence microscopy.'
};

export default function Page() {
  return <PageClient />;
}

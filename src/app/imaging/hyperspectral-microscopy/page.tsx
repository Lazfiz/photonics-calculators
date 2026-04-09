import type { Metadata } from "next";
import PageClient from "./page-client";

export const metadata: Metadata = {
    canonical: "https://photonics-calculators.vercel.app/imaging/hyperspectral-microscopy",
    title: 'Hyperspectral Microscopy',
  description: 'Configure hyperspectral data cubes: spectral range, bands, data size, acquisition time, and SNR tradeoffs.'
};

export default function Page() {
  return <PageClient />;
}

import type { Metadata } from "next";
import PageClient from "./page-client";

export const metadata: Metadata = {
    canonical: "https://photonics-calculators.vercel.app/detectors/readout-noise",
    title: 'Readout Noise',
  description: 'Interactive Readout Noise calculator for photonics and optical engineering.'
};

export default function Page() {
  return <PageClient />;
}

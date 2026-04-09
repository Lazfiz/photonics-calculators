import type { Metadata } from "next";
import PageClient from "./page-client";

export const metadata: Metadata = {
    canonical: "https://photonics-calculators.vercel.app/spectroscopy/cavity-ring-down",
    title: 'Cavity Ring-Down Spectroscopy',
  description: 'Model CRDS ring-down time, sensitivity, and finesse. Visualize exponential decay with and without sample absorption.'
};

export default function Page() {
  return <PageClient />;
}

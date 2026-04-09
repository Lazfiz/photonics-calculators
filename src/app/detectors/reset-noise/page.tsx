import type { Metadata } from "next";
import PageClient from "./page-client";

export const metadata: Metadata = {
    canonical: "https://photonics-calculators.vercel.app/detectors/reset-noise",
    title: 'Reset Noise',
  description: 'Interactive Reset Noise calculator for photonics and optical engineering.'
};

export default function Page() {
  return <PageClient />;
}

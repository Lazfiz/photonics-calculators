import type { Metadata } from "next";
import PageClient from "./page-client";

export const metadata: Metadata = {
    canonical: "https://photonics-calculators.vercel.app/detectors/pmt-gain",
    title: 'Pmt Gain',
  description: 'Interactive Pmt Gain calculator for photonics and optical engineering.'
};

export default function Page() {
  return <PageClient />;
}

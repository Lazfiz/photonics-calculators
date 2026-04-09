import type { Metadata } from "next";
import PageClient from "./page-client";

export const metadata: Metadata = {
    canonical: "https://photonics-calculators.vercel.app/spectroscopy/time-resolved",
    title: 'Time-Resolved Spectroscopy',
  description: 'TCSPC and streak camera fundamentals. IRF convolution, temporal resolution, and decay analysis.'
};

export default function Page() {
  return <PageClient />;
}

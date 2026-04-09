import type { Metadata } from "next";
import PageClient from "./page-client";

export const metadata: Metadata = {
    canonical: "https://photonics-calculators.vercel.app/detectors/streak-camera",
    title: 'Streak Camera',
  description: 'Streak camera basics calculator. Models temporal resolution, sweep speed, time window, and spatial resolution trade-offs.'
};

export default function Page() {
  return <PageClient />;
}

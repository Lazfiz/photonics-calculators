import type { Metadata } from "next";
import PageClient from "./page-client";

export const metadata: Metadata = {
    canonical: "https://photonics-calculators.vercel.app/detectors/ccd-vs-cmos",
    title: 'CCD vs CMOS Sensor Comparison',
  description: 'Compare sensor architectures — SNR, dynamic range, and performance metrics.'
};

export default function Page() {
  return <PageClient />;
}

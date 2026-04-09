import type { Metadata } from "next";
import PageClient from "./page-client";

export const metadata: Metadata = {
    canonical: "https://photonics-calculators.vercel.app/laser-safety/scan-failure",
    title: 'Scan Failure Analysis',
  description: 'Analyzes hazard when a scanning laser fails to scan, causing the beam to dwell on a single point. IEC 60825-1 scan failure assessment.'
};

export default function Page() {
  return <PageClient />;
}

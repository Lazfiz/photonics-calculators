import type { Metadata } from "next";
import PageClient from "./page-client";

export const metadata: Metadata = {
    canonical: "https://photonics-calculators.vercel.app/laser-safety/ael-limits",
    title: 'Accessible Emission Limits (AEL)',
  description: 'IEC 60825-1 laser classification AEL thresholds. Simplified model for educational reference.'
};

export default function Page() {
  return <PageClient />;
}

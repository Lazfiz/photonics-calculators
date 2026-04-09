import type { Metadata } from "next";
import PageClient from "./page-client";

export const metadata: Metadata = {
    canonical: "https://photonics-calculators.vercel.app/imaging/adaptive-optics-microscopy",
    title: 'Adaptive Optics in Microscopy',
  description: 'Wavefront correction, Strehl ratio recovery, and resolution improvement for deep-tissue imaging.'
};

export default function Page() {
  return <PageClient />;
}

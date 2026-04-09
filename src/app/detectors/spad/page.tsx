import type { Metadata } from "next";
import PageClient from "./page-client";

export const metadata: Metadata = {
    canonical: "https://photonics-calculators.vercel.app/detectors/spad",
    title: 'SPAD Detector Calculator',
  description: 'Single-photon avalanche diode — PDE, DCR, dead time, afterpulsing, and SNR analysis.'
};

export default function Page() {
  return <PageClient />;
}

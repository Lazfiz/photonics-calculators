import type { Metadata } from "next";
import PageClient from "./page-client";

export const metadata: Metadata = {
    canonical: "https://photonics-calculators.vercel.app/imaging/signal-to-noise",
    title: 'Imaging Signal-to-Noise Ratio',
  description: 'Comprehensive SNR calculation for microscopy imaging systems.'
};

export default function Page() {
  return <PageClient />;
}

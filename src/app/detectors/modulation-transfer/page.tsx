import type { Metadata } from "next";
import PageClient from "./page-client";

export const metadata: Metadata = {
    canonical: "https://photonics-calculators.vercel.app/detectors/modulation-transfer",
    title: 'Modulation Transfer',
  description: 'Interactive Modulation Transfer calculator for photonics and optical engineering.'
};

export default function Page() {
  return <PageClient />;
}

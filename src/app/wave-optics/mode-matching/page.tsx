import type { Metadata } from "next";
import PageClient from "./page-client";

export const metadata: Metadata = {
    canonical: "https://photonics-calculators.vercel.app/wave-optics/mode-matching",
    title: 'Mode Matching',
  description: 'Find the optimal lens for coupling one Gaussian beam mode into another.'
};

export default function Page() {
  return <PageClient />;
}

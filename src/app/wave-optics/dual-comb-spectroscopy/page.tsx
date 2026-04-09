import type { Metadata } from "next";
import PageClient from "./page-client";

export const metadata: Metadata = {
    canonical: "https://photonics-calculators.vercel.app/wave-optics/dual-comb-spectroscopy",
    title: 'Dual-Comb Spectroscopy',
  description: 'High-resolution spectroscopy using two frequency combs with slightly different repetition rates.'
};

export default function Page() {
  return <PageClient />;
}

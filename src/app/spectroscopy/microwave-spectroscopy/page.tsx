import type { Metadata } from "next";
import PageClient from "./page-client";

export const metadata: Metadata = {
    canonical: "https://photonics-calculators.vercel.app/spectroscopy/microwave-spectroscopy",
    title: 'Microwave / Rotational Spectroscopy',
  description: 'Pure rotational transitions for molecular structure determination (1–300 GHz).',
};

export default function Page() {
  return <PageClient />;
}

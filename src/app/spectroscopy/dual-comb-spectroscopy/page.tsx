import type { Metadata } from "next";
import PageClient from "./page-client";

export const metadata: Metadata = {
    alternates: { canonical: 'https://photonics-calculators.vercel.app/spectroscopy/dual-comb-spectroscopy' },
    title: 'Dual-Comb Spectroscopy Calculator',
  description: 'Model dual-comb spectroscopy parameters: resolution, bandwidth, update rate, and multi-heterodyne RF spectrum.'
};

export default function Page() {
  return <PageClient />;
}

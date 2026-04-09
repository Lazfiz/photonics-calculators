import type { Metadata } from "next";
import PageClient from "./page-client";

export const metadata: Metadata = {
    canonical: "https://photonics-calculators.vercel.app/spectroscopy/optical-path-length",
      title: 'Optical Path Length Calculator',
  description: 'OPL = n d N / cos() — effective path through a medium.',
};

export default function Page() {
  return <PageClient />;
}

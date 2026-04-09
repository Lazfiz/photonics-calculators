import type { Metadata } from "next";
import PageClient from "./page-client";

export const metadata: Metadata = {
    canonical: "https://photonics-calculators.vercel.app/fiber-optics/polarization-controller",
    title: 'Polarization Controller',
  description: 'Interactive Polarization Controller calculator for photonics and optical engineering.'
};

export default function Page() {
  return <PageClient />;
}

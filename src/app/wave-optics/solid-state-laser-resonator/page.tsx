import type { Metadata } from "next";
import PageClient from "./page-client";

export const metadata: Metadata = {
    canonical: "https://photonics-calculators.vercel.app/wave-optics/solid-state-laser-resonator",
    title: 'Solid State Laser Resonator',
  description: 'Interactive Solid State Laser Resonator calculator for photonics and optical engineering.'
};

export default function Page() {
  return <PageClient />;
}

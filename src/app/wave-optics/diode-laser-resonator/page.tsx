import type { Metadata } from "next";
import PageClient from "./page-client";

export const metadata: Metadata = {
    canonical: "https://photonics-calculators.vercel.app/wave-optics/diode-laser-resonator",
    title: 'Diode Laser Resonator',
  description: 'Interactive Diode Laser Resonator calculator for photonics and optical engineering.'
};

export default function Page() {
  return <PageClient />;
}

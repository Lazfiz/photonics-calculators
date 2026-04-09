import type { Metadata } from "next";
import PageClient from "./page-client";

export const metadata: Metadata = {
    canonical: "https://photonics-calculators.vercel.app/wave-optics/gas-laser-resonator",
    title: 'Gas Laser Resonator',
  description: 'Interactive Gas Laser Resonator calculator for photonics and optical engineering.'
};

export default function Page() {
  return <PageClient />;
}

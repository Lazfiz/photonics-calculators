import type { Metadata } from "next";
import PageClient from "./page-client";

export const metadata: Metadata = {
    canonical: "https://photonics-calculators.vercel.app/spectroscopy/terahertz-spectroscopy",
    title: 'Terahertz (THz) Spectroscopy',
  description: 'Probing low-energy excitations: phonon modes, hydrogen bonding, lattice vibrations (0.1–10 THz).',
};

export default function Page() {
  return <PageClient />;
}

import type { Metadata } from "next";
import PageClient from "./page-client";

export const metadata: Metadata = {
    title: 'Terahertz (THz) Spectroscopy',
  description: 'Probing low-energy excitations: phonon modes, hydrogen bonding, lattice vibrations (0.1–10 THz).',
};

export default function Page() {
  return <PageClient />;
}

import type { Metadata } from "next";
import PageClient from "./page-client";

export const metadata: Metadata = {
    canonical: "https://photonics-calculators.vercel.app/free-space-comms/quantum-key-distribution",
    title: 'Quantum Key Distribution',
  description: 'Interactive Quantum Key Distribution calculator for photonics and optical engineering.'
};

export default function Page() {
  return <PageClient />;
}

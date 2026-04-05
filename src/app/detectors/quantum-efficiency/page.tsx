import type { Metadata } from "next";
import PageClient from "./page-client";

export const metadata: Metadata = {
  title: 'Quantum Efficiency',
  description: 'Interactive detector quantum-efficiency explorer with detector presets, fill factor, microlens gain, and wavelength response curves.',
};

export default function Page() {
  return <PageClient />;
}

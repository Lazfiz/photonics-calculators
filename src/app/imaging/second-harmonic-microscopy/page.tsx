import type { Metadata } from "next";
import PageClient from "./page-client";

export const metadata: Metadata = {
    title: 'Second-Harmonic Generation Microscopy Calculator',
  description: 'Calculate SHG wavelength, resolution, phase matching, and signal strength for SHG microscopy of collagen, muscle, and other non-centrosymmetric structures.'
};

export default function Page() {
  return <PageClient />;
}

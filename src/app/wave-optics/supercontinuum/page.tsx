import type { Metadata } from "next";
import PageClient from "./page-client";

export const metadata: Metadata = {
    alternates: { canonical: 'https://photonics-calculators.vercel.app/wave-optics/supercontinuum' },
    title: 'Supercontinuum Generation',
  description: 'Broadband SC generation in photonic crystal fibers via soliton fission, SPM, and dispersive wave generation.'
};

export default function Page() {
  return <PageClient />;
}

import type { Metadata } from "next";
import PageClient from "./page-client";

export const metadata: Metadata = {
    alternates: { canonical: 'https://photonics-calculators.vercel.app/detectors/photon-transfer' },
    title: 'Photon Transfer',
  description: 'Interactive Photon Transfer calculator for photonics and optical engineering.'
};

export default function Page() {
  return <PageClient />;
}

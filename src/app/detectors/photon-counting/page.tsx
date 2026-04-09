import type { Metadata } from "next";
import PageClient from "./page-client";

export const metadata: Metadata = {
    alternates: { canonical: 'https://photonics-calculators.vercel.app/detectors/photon-counting' },
    title: 'Photon Counting',
  description: 'Interactive Photon Counting calculator for photonics and optical engineering.'
};

export default function Page() {
  return <PageClient />;
}

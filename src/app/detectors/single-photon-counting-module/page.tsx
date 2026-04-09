import type { Metadata } from "next";
import PageClient from "./page-client";

export const metadata: Metadata = {
    alternates: { canonical: 'https://photonics-calculators.vercel.app/detectors/single-photon-counting-module' },
    title: 'Single Photon Counting Module',
  description: 'Interactive Single Photon Counting Module calculator for photonics and optical engineering.'
};

export default function Page() {
  return <PageClient />;
}

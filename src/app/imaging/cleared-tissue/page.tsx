import type { Metadata } from "next";
import PageClient from "./page-client";

export const metadata: Metadata = {
    alternates: { canonical: 'https://photonics-calculators.vercel.app/imaging/cleared-tissue' },
    title: 'Cleared Tissue Imaging Calculator',
  description: 'Optical clearing tissue imaging: resolution, transmission, ballistic photon fraction, and RI matching.'
};

export default function Page() {
  return <PageClient />;
}

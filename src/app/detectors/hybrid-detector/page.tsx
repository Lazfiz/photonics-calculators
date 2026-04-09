import type { Metadata } from "next";
import PageClient from "./page-client";

export const metadata: Metadata = {
    alternates: { canonical: 'https://photonics-calculators.vercel.app/detectors/hybrid-detector' },
    title: 'Hybrid Detector Design',
  description: 'Photodiode + TIA hybrid — noise analysis, NEP, and gain optimization.'
};

export default function Page() {
  return <PageClient />;
}

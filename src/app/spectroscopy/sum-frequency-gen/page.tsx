import type { Metadata } from "next";
import PageClient from "./page-client";

export const metadata: Metadata = {
    alternates: { canonical: 'https://photonics-calculators.vercel.app/spectroscopy/sum-frequency-gen' },
    title: 'Sum Frequency Generation Spectroscopy',
  description: 'Surface-specific vibrational probe. SFG is forbidden in centrosymmetric media — only surfaces and interfaces contribute.'
};

export default function Page() {
  return <PageClient />;
}

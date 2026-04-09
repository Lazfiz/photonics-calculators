import type { Metadata } from "next";
import PageClient from "./page-client";

export const metadata: Metadata = {
    alternates: { canonical: 'https://photonics-calculators.vercel.app/wave-optics/chirped-pulse' },
    title: 'Chirped Pulse Amplification (CPA)',
  description: 'Stretch, amplify, compress — bypassing damage thresholds.'
};

export default function Page() {
  return <PageClient />;
}

import type { Metadata } from "next";
import PageClient from "./page-client";

export const metadata: Metadata = {
    alternates: { canonical: 'https://photonics-calculators.vercel.app/spectroscopy/difference-frequency-gen' },
    title: 'Difference Frequency Generation',
  description: 'Generate tunable mid-IR via DFG: _idler = _pump − _signal. Essential for IR spectroscopy sources.'
};

export default function Page() {
  return <PageClient />;
}

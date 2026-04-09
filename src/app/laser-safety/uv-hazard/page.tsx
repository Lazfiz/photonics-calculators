import type { Metadata } from "next";
import PageClient from "./page-client";

export const metadata: Metadata = {
    alternates: { canonical: 'https://photonics-calculators.vercel.app/laser-safety/uv-hazard' },
      title: 'UV Hazard Calculator',
  description: 'UV hazard assessment using ACGIH actinic UV weighting function S(). Covers 200–400 nm spectral region.',
};

export default function Page() {
  return <PageClient />;
}

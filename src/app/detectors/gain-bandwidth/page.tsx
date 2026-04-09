import type { Metadata } from "next";
import PageClient from "./page-client";

export const metadata: Metadata = {
    alternates: { canonical: 'https://photonics-calculators.vercel.app/detectors/gain-bandwidth' },
      title: 'Gain-Bandwidth Product',
  description: 'GBW = A₀ f₋₃dB. The product of DC gain and bandwidth is constant for a single-pole system.',
};

export default function Page() {
  return <PageClient />;
}

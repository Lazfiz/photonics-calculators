import type { Metadata } from "next";
import PageClient from "./page-client";

export const metadata: Metadata = {
      title: 'Gain-Bandwidth Product',
  description: 'GBW = A₀ f₋₃dB. The product of DC gain and bandwidth is constant for a single-pole system.',
};

export default function Page() {
  return <PageClient />;
}

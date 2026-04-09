import type { Metadata } from "next";
import PageClient from "./page-client";

export const metadata: Metadata = {
    alternates: { canonical: 'https://photonics-calculators.vercel.app/wave-optics/cavity-stability' },
    title: 'Cavity Stability Diagram',
  description: 'Two-mirror cavity stability: g = 1 - L/R, g = 1 - L/R. Stable when 0 ≤ gg ≤ 1.'
};

export default function Page() {
  return <PageClient />;
}

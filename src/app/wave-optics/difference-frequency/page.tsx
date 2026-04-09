import type { Metadata } from "next";
import PageClient from "./page-client";

export const metadata: Metadata = {
    canonical: "https://photonics-calculators.vercel.app/wave-optics/difference-frequency",
    title: 'Difference Frequency Generation (DFG)',
  description: 'Downconversion via χ⁽²⁾: p − s i for mid-IR generation.'
};

export default function Page() {
  return <PageClient />;
}

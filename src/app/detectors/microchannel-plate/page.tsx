import type { Metadata } from "next";
import PageClient from "./page-client";

export const metadata: Metadata = {
    canonical: "https://photonics-calculators.vercel.app/detectors/microchannel-plate",
    title: 'Microchannel Plate',
  description: 'Interactive Microchannel Plate calculator for photonics and optical engineering.'
};

export default function Page() {
  return <PageClient />;
}

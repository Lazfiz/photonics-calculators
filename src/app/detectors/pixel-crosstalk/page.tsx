import type { Metadata } from "next";
import PageClient from "./page-client";

export const metadata: Metadata = {
    canonical: "https://photonics-calculators.vercel.app/detectors/pixel-crosstalk",
    title: 'Pixel Crosstalk',
  description: 'Interactive Pixel Crosstalk calculator for photonics and optical engineering.'
};

export default function Page() {
  return <PageClient />;
}

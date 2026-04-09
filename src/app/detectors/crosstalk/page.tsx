import type { Metadata } from "next";
import PageClient from "./page-client";

export const metadata: Metadata = {
    canonical: "https://photonics-calculators.vercel.app/detectors/crosstalk",
    title: 'Pixel Crosstalk',
  description: 'Optical and electrical crosstalk between adjacent pixels due to charge diffusion.'
};

export default function Page() {
  return <PageClient />;
}

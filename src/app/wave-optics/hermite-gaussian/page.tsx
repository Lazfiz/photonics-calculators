import type { Metadata } from "next";
import PageClient from "./page-client";

export const metadata: Metadata = {
    canonical: "https://photonics-calculators.vercel.app/wave-optics/hermite-gaussian",
    title: 'Hermite-Gaussian Modes (TEMmn)',
  description: 'Rectangular higher-order Gaussian beam modes.'
};

export default function Page() {
  return <PageClient />;
}

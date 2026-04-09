import type { Metadata } from "next";
import PageClient from "./page-client";

export const metadata: Metadata = {
    canonical: "https://photonics-calculators.vercel.app/fiber-optics/fiber-loop-mirror",
    title: 'Fiber Loop Mirror (Sagnac)',
  description: 'Sagnac fiber loop mirror reflectance, spectral response, and birefringent filter design.'
};

export default function Page() {
  return <PageClient />;
}

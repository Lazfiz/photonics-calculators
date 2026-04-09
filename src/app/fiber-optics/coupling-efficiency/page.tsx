import type { Metadata } from "next";
import PageClient from "./page-client";

export const metadata: Metadata = {
    canonical: "https://photonics-calculators.vercel.app/fiber-optics/coupling-efficiency",
    title: 'Fiber Coupling Efficiency',
  description: 'Estimate Gaussian-to-fiber coupling loss from NA mismatch, lateral offset, and angular misalignment.'
};

export default function Page() {
  return <PageClient />;
}

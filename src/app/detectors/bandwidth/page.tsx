import type { Metadata } from "next";
import PageClient from "./page-client";

export const metadata: Metadata = {
    canonical: "https://photonics-calculators.vercel.app/detectors/bandwidth",
    title: 'Bandwidth vs Noise Trade-off',
  description: 'Noise increases with f. Wider bandwidth = faster response but more noise.'
};

export default function Page() {
  return <PageClient />;
}

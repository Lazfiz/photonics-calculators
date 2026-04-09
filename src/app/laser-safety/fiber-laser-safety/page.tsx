import type { Metadata } from "next";
import PageClient from "./page-client";

export const metadata: Metadata = {
    canonical: "https://photonics-calculators.vercel.app/laser-safety/fiber-laser-safety",
    title: 'Fiber Laser Safety Calculator',
  description: 'Analyze output power, fiber facet irradiance, and NOHD for fiber laser systems (1064/1550 nm typical).',
};

export default function Page() {
  return <PageClient />;
}

import type { Metadata } from "next";
import PageClient from "./page-client";

export const metadata: Metadata = {
    canonical: "https://photonics-calculators.vercel.app/laser-safety/lidar-safety",
    title: 'LiDAR Laser Safety Calculator',
  description: 'Analyze pulse energy, PRF-corrected MPE, and NOHD for LiDAR systems (905/1550 nm).',
};

export default function Page() {
  return <PageClient />;
}

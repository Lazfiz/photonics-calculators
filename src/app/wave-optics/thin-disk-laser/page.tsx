import type { Metadata } from "next";
import PageClient from "./page-client";

export const metadata: Metadata = {
    canonical: "https://photonics-calculators.vercel.app/wave-optics/thin-disk-laser",
    title: 'Thin Disk Laser',
  description: 'Interactive Thin Disk Laser calculator for photonics and optical engineering.'
};

export default function Page() {
  return <PageClient />;
}

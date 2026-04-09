import type { Metadata } from "next";
import PageClient from "./page-client";

export const metadata: Metadata = {
    canonical: "https://photonics-calculators.vercel.app/fiber-optics/rare-earth-fiber",
    title: 'Rare Earth Fiber',
  description: 'Interactive Rare Earth Fiber calculator for photonics and optical engineering.'
};

export default function Page() {
  return <PageClient />;
}

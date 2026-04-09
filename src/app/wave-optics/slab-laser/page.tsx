import type { Metadata } from "next";
import PageClient from "./page-client";

export const metadata: Metadata = {
    alternates: { canonical: 'https://photonics-calculators.vercel.app/wave-optics/slab-laser' },
    title: 'Slab Laser',
  description: 'Interactive Slab Laser calculator for photonics and optical engineering.'
};

export default function Page() {
  return <PageClient />;
}

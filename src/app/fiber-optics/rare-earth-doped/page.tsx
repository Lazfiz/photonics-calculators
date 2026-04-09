import type { Metadata } from "next";
import PageClient from "./page-client";

export const metadata: Metadata = {
    alternates: { canonical: 'https://photonics-calculators.vercel.app/fiber-optics/rare-earth-doped' },
    title: 'Rare Earth Doped',
  description: 'Interactive Rare Earth Doped calculator for photonics and optical engineering.'
};

export default function Page() {
  return <PageClient />;
}

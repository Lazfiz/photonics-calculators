import type { Metadata } from "next";
import PageClient from "./page-client";

export const metadata: Metadata = {
    alternates: { canonical: 'https://photonics-calculators.vercel.app/fiber-optics/fiber-laser' },
    title: 'Fiber Laser',
  description: 'Interactive Fiber Laser calculator for photonics and optical engineering.'
};

export default function Page() {
  return <PageClient />;
}

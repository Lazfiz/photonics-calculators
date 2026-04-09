import type { Metadata } from "next";
import PageClient from "./page-client";

export const metadata: Metadata = {
    alternates: { canonical: 'https://photonics-calculators.vercel.app/fiber-optics/fiber-bragg-grating' },
    title: 'Fiber Bragg Grating',
  description: 'Interactive Fiber Bragg Grating calculator for photonics and optical engineering.'
};

export default function Page() {
  return <PageClient />;
}

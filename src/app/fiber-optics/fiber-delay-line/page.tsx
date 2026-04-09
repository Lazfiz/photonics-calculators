import type { Metadata } from "next";
import PageClient from "./page-client";

export const metadata: Metadata = {
    alternates: { canonical: 'https://photonics-calculators.vercel.app/fiber-optics/fiber-delay-line' },
    title: 'Fiber Delay Line',
  description: 'Interactive Fiber Delay Line calculator for photonics and optical engineering.'
};

export default function Page() {
  return <PageClient />;
}

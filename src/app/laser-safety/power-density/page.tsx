import type { Metadata } from "next";
import PageClient from "./page-client";

export const metadata: Metadata = {
    alternates: { canonical: 'https://photonics-calculators.vercel.app/laser-safety/power-density' },
    title: 'Power Density Calculator',
  description: 'Interactive Power Density Calculator calculator for photonics and optical engineering.'
};

export default function Page() {
  return <PageClient />;
}

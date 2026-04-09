import type { Metadata } from "next";
import PageClient from "./page-client";

export const metadata: Metadata = {
    alternates: { canonical: 'https://photonics-calculators.vercel.app/laser-safety/beam-diameter-conversion' },
    title: 'Beam Diameter Conversion',
  description: 'Interactive Beam Diameter Conversion calculator for photonics and optical engineering.'
};

export default function Page() {
  return <PageClient />;
}

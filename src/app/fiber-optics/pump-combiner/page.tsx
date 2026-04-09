import type { Metadata } from "next";
import PageClient from "./page-client";

export const metadata: Metadata = {
    canonical: "https://photonics-calculators.vercel.app/fiber-optics/pump-combiner",
    title: 'Pump Combiner',
  description: 'Interactive Pump Combiner calculator for photonics and optical engineering.'
};

export default function Page() {
  return <PageClient />;
}

import type { Metadata } from "next";
import PageClient from "./page-client";

export const metadata: Metadata = {
    canonical: "https://photonics-calculators.vercel.app/wave-optics/optical-parametric-oscillator",
    title: 'Optical Parametric Oscillator',
  description: 'Interactive Optical Parametric Oscillator calculator for photonics and optical engineering.'
};

export default function Page() {
  return <PageClient />;
}

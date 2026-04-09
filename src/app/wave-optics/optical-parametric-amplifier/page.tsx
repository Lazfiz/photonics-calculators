import type { Metadata } from "next";
import PageClient from "./page-client";

export const metadata: Metadata = {
    alternates: { canonical: 'https://photonics-calculators.vercel.app/wave-optics/optical-parametric-amplifier' },
    title: 'Optical Parametric Amplifier',
  description: 'Interactive Optical Parametric Amplifier calculator for photonics and optical engineering.'
};

export default function Page() {
  return <PageClient />;
}

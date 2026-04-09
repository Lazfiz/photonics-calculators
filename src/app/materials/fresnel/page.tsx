import type { Metadata } from "next";
import PageClient from "./page-client";

export const metadata: Metadata = {
    canonical: "https://photonics-calculators.vercel.app/materials/fresnel",
    title: 'Fresnel Equations',
  description: 'Interactive Fresnel reflection and transmission at a dielectric interface with sliders, presets, and angle sweeps.'
};

export default function Page() {
  return <PageClient />;
}

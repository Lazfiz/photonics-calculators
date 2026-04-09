import type { Metadata } from "next";
import PageClient from "./page-client";

export const metadata: Metadata = {
    canonical: "https://photonics-calculators.vercel.app/fiber-optics/polarization-maintaining",
    title: 'Polarization Maintaining',
  description: 'Interactive Polarization Maintaining calculator for photonics and optical engineering.'
};

export default function Page() {
  return <PageClient />;
}

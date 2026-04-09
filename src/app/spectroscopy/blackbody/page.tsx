import type { Metadata } from "next";
import PageClient from "./page-client";

export const metadata: Metadata = {
    canonical: "https://photonics-calculators.vercel.app/spectroscopy/blackbody",
  title: 'Blackbody Radiation',
  description: "Planck's law spectral radiance, Wien displacement, and Stefan-Boltzmann total power.",
};

export default function Page() {
  return <PageClient />;
}

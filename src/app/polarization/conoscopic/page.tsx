import type { Metadata } from "next";
import PageClient from "./page-client";

export const metadata: Metadata = {
    canonical: "https://photonics-calculators.vercel.app/polarization/conoscopic",
    title: 'Conoscopic Observation',
  description: 'Simulate conoscopic interference figures (isochromates and isogyres) for uniaxial and biaxial crystals between crossed polarizers.'
};

export default function Page() {
  return <PageClient />;
}

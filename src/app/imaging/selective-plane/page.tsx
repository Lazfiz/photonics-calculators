import type { Metadata } from "next";
import PageClient from "./page-client";

export const metadata: Metadata = {
    canonical: "https://photonics-calculators.vercel.app/imaging/selective-plane",
    title: 'Selective Plane Illumination Calculator',
  description: 'SPIM illumination parameters: sheet thickness, beam waist, Rayleigh range, and confocal parameter.'
};

export default function Page() {
  return <PageClient />;
}

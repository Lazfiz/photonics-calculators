import type { Metadata } from "next";
import PageClient from "./page-client";

export const metadata: Metadata = {
    canonical: "https://photonics-calculators.vercel.app/spectroscopy/libs-analysis",
    title: 'LIBS Analysis Calculator',
  description: 'Laser-Induced Breakdown Spectroscopy: model plasma line broadening (Stark + Doppler) and estimate plasma conditions.'
};

export default function Page() {
  return <PageClient />;
}

import type { Metadata } from "next";
import PageClient from "./page-client";

export const metadata: Metadata = {
    canonical: "https://photonics-calculators.vercel.app/polarization/polarization-scrambling",
    title: 'Polarization Scrambling',
  description: 'Simulate polarization scrambling: how randomizing polarization state reduces residual polarization.'
};

export default function Page() {
  return <PageClient />;
}

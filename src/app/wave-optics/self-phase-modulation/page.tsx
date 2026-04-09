import type { Metadata } from "next";
import PageClient from "./page-client";

export const metadata: Metadata = {
    alternates: { canonical: 'https://photonics-calculators.vercel.app/wave-optics/self-phase-modulation' },
    title: 'Self-Phase Modulation (SPM)',
  description: 'Intensity-dependent phase shift and spectral broadening from the optical Kerr effect.'
};

export default function Page() {
  return <PageClient />;
}

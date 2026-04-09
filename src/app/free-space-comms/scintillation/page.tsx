import type { Metadata } from "next";
import PageClient from "./page-client";

export const metadata: Metadata = {
    alternates: { canonical: 'https://photonics-calculators.vercel.app/free-space-comms/scintillation' },
    title: 'Scintillation Index',
  description: 'Rytov variance, aperture averaging, and fade probability for atmospheric turbulence.'
};

export default function Page() {
  return <PageClient />;
}

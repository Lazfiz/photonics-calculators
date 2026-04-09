import type { Metadata } from "next";
import PageClient from "./page-client";

export const metadata: Metadata = {
    alternates: { canonical: 'https://photonics-calculators.vercel.app/detectors/boxcar-integrator' },
    title: 'Boxcar Integrator',
  description: 'Gated signal averaging — recover repetitive signals from noise.'
};

export default function Page() {
  return <PageClient />;
}

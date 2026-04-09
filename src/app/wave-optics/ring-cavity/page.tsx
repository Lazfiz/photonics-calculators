import type { Metadata } from "next";
import PageClient from "./page-client";

export const metadata: Metadata = {
    alternates: { canonical: 'https://photonics-calculators.vercel.app/wave-optics/ring-cavity' },
    title: 'Ring Resonator Design',
  description: 'Ring cavity stability, modes, and spectral analysis.'
};

export default function Page() {
  return <PageClient />;
}

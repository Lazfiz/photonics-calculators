import type { Metadata } from "next";
import PageClient from "./page-client";

export const metadata: Metadata = {
    canonical: "https://photonics-calculators.vercel.app/wave-optics/attosecond-pulse",
    title: 'Attosecond Pulse Generation',
  description: 'High-harmonic generation and isolated attosecond pulse parameters.'
};

export default function Page() {
  return <PageClient />;
}

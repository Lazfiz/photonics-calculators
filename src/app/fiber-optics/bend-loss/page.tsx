import type { Metadata } from "next";
import PageClient from "./page-client";

export const metadata: Metadata = {
    alternates: { canonical: 'https://photonics-calculators.vercel.app/fiber-optics/bend-loss' },
    title: 'Macro Bending Loss',
  description: 'Estimate macro-bending loss for single-mode fiber using simplified Marcuse formula.'
};

export default function Page() {
  return <PageClient />;
}

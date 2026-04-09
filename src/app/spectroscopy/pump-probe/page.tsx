import type { Metadata } from "next";
import PageClient from "./page-client";

export const metadata: Metadata = {
    alternates: { canonical: 'https://photonics-calculators.vercel.app/spectroscopy/pump-probe' },
    title: 'Pump-Probe Spectroscopy',
  description: 'Ultrafast dynamics via time-resolved differential transmission. GSB, SE, and ESA contributions.'
};

export default function Page() {
  return <PageClient />;
}

import type { Metadata } from "next";
import PageClient from "./page-client";

export const metadata: Metadata = {
    alternates: { canonical: 'https://photonics-calculators.vercel.app/spectroscopy/stimulated-raman' },
    title: 'Stimulated Raman Scattering (SRS)',
  description: 'Coherent Raman gain/loss process for high-speed chemical imaging without non-resonant background.'
};

export default function Page() {
  return <PageClient />;
}

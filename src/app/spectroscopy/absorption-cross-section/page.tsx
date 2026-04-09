import type { Metadata } from "next";
import PageClient from "./page-client";

export const metadata: Metadata = {
    alternates: { canonical: 'https://photonics-calculators.vercel.app/spectroscopy/absorption-cross-section' },
      title: 'Absorption Cross-Section Calculator',
  description: '= 1000 / (N_A ln 10) — convert molar extinction coefficient to molecular cross-section.',
};

export default function Page() {
  return <PageClient />;
}

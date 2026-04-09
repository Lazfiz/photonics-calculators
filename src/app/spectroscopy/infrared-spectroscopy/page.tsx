import type { Metadata } from "next";
import PageClient from "./page-client";

export const metadata: Metadata = {
    alternates: { canonical: 'https://photonics-calculators.vercel.app/spectroscopy/infrared-spectroscopy' },
    title: 'Infrared (IR) Spectroscopy',
  description: 'Molecular vibrational absorption in the mid-infrared region (400–4000 cm⁻¹).',
};

export default function Page() {
  return <PageClient />;
}

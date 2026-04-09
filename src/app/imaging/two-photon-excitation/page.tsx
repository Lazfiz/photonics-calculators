import type { Metadata } from "next";
import PageClient from "./page-client";

export const metadata: Metadata = {
    alternates: { canonical: 'https://photonics-calculators.vercel.app/imaging/two-photon-excitation' },
    title: 'Two-Photon Excitation Calculator',
  description: 'Calculate two-photon excitation wavelength, peak power, and pulse energy from laser parameters.'
};

export default function Page() {
  return <PageClient />;
}

import type { Metadata } from "next";
import PageClient from "./page-client";

export const metadata: Metadata = {
    alternates: { canonical: 'https://photonics-calculators.vercel.app/imaging/fcs' },
    title: 'FCS Calculator',
  description: 'Fluorescence Correlation Spectroscopy — diffusion time, concentration, and confocal volume.'
};

export default function Page() {
  return <PageClient />;
}

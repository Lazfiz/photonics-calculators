import type { Metadata } from "next";
import PageClient from "./page-client";

export const metadata: Metadata = {
    alternates: { canonical: 'https://photonics-calculators.vercel.app/detectors/pmt' },
    title: 'Pmt',
  description: 'Interactive Pmt calculator for photonics and optical engineering.'
};

export default function Page() {
  return <PageClient />;
}

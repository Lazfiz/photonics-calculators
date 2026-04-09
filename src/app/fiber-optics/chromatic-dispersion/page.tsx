import type { Metadata } from "next";
import PageClient from "./page-client";

export const metadata: Metadata = {
    alternates: { canonical: 'https://photonics-calculators.vercel.app/fiber-optics/chromatic-dispersion' },
    title: 'Chromatic Dispersion (CD)',
  description: 'Calculate chromatic dispersion, pulse broadening, and system penalties for single-mode fiber.'
};

export default function Page() {
  return <PageClient />;
}

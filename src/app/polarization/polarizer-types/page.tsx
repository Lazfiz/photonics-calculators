import type { Metadata } from "next";
import PageClient from "./page-client";

export const metadata: Metadata = {
    alternates: { canonical: 'https://photonics-calculators.vercel.app/polarization/polarizer-types' },
    title: 'Polarizer Types Comparison',
  description: 'Compare extinction ratio, transmission, damage threshold, and other specs across common polarizer types.'
};

export default function Page() {
  return <PageClient />;
}

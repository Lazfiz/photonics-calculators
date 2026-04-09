import type { Metadata } from "next";
import PageClient from "./page-client";

export const metadata: Metadata = {
    alternates: { canonical: 'https://photonics-calculators.vercel.app/polarization/microscope-polarizer' },
    title: 'Microscope Polarizer Calculator',
  description: 'Analyze polarization effects in microscopy: extinction, retardance sensitivity, NA degradation, and Michel-Lévy colors.'
};

export default function Page() {
  return <PageClient />;
}

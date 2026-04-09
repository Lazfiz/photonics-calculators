import type { Metadata } from "next";
import PageClient from "./page-client";

export const metadata: Metadata = {
    canonical: "https://photonics-calculators.vercel.app/polarization/birefringent-polarizer",
    title: 'Birefringent Polarizer Design',
  description: 'Compare Glan, Wollaston, Rochon, and Senarmont polarizer designs using birefringent crystal prisms.'
};

export default function Page() {
  return <PageClient />;
}

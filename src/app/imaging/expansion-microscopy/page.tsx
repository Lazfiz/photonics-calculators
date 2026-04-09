import type { Metadata } from "next";
import PageClient from "./page-client";

export const metadata: Metadata = {
    canonical: "https://photonics-calculators.vercel.app/imaging/expansion-microscopy",
    title: 'Expansion Microscopy Calculator',
  description: 'ExM effective resolution, probe size reduction, and expansion trade-offs.'
};

export default function Page() {
  return <PageClient />;
}

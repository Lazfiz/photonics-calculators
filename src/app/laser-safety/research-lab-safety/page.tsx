import type { Metadata } from "next";
import PageClient from "./page-client";

export const metadata: Metadata = {
    alternates: { canonical: 'https://photonics-calculators.vercel.app/laser-safety/research-lab-safety' },
    title: 'Research Lab Laser Safety Calculator',
  description: 'Evaluate laser hazard zones, OD requirements, beam path analysis, and room coverage for research labs.'
};

export default function Page() {
  return <PageClient />;
}

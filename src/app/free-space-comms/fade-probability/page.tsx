import type { Metadata } from "next";
import PageClient from "./page-client";

export const metadata: Metadata = {
    canonical: "https://photonics-calculators.vercel.app/free-space-comms/fade-probability",
    title: 'Fade Probability',
  description: 'Interactive Fade Probability calculator for photonics and optical engineering.'
};

export default function Page() {
  return <PageClient />;
}

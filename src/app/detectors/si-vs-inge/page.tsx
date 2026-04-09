import type { Metadata } from "next";
import PageClient from "./page-client";

export const metadata: Metadata = {
    canonical: "https://photonics-calculators.vercel.app/detectors/si-vs-inge",
    title: 'Si Vs Inge',
  description: 'Interactive Si Vs Inge calculator for photonics and optical engineering.'
};

export default function Page() {
  return <PageClient />;
}

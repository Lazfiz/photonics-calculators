import type { Metadata } from "next";
import PageClient from "./page-client";

export const metadata: Metadata = {
    canonical: "https://photonics-calculators.vercel.app/free-space-comms/beam-wander",
    title: 'Beam Wander',
  description: 'Interactive Beam Wander calculator for photonics and optical engineering.'
};

export default function Page() {
  return <PageClient />;
}

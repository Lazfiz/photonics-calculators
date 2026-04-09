import type { Metadata } from "next";
import PageClient from "./page-client";

export const metadata: Metadata = {
    canonical: "https://photonics-calculators.vercel.app/free-space-comms/acquisition-tracking",
    title: 'Acquisition Tracking',
  description: 'Interactive Acquisition Tracking calculator for photonics and optical engineering.'
};

export default function Page() {
  return <PageClient />;
}

import type { Metadata } from "next";
import PageClient from "./page-client";

export const metadata: Metadata = {
    canonical: "https://photonics-calculators.vercel.app/free-space-comms/eye-safety-fso",
    title: 'Eye Safety Fso',
  description: 'Interactive Eye Safety Fso calculator for photonics and optical engineering.'
};

export default function Page() {
  return <PageClient />;
}

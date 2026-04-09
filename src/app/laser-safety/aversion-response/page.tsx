import type { Metadata } from "next";
import PageClient from "./page-client";

export const metadata: Metadata = {
    canonical: "https://photonics-calculators.vercel.app/laser-safety/aversion-response",
    title: 'Aversion Response Time',
  description: 'Calculates MPE at the natural aversion/blink response time (0.25 s) and Class 2 limits per ANSI Z136.1 / IEC 60825-1.'
};

export default function Page() {
  return <PageClient />;
}

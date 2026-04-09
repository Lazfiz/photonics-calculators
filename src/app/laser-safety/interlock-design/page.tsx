import type { Metadata } from "next";
import PageClient from "./page-client";

export const metadata: Metadata = {
    canonical: "https://photonics-calculators.vercel.app/laser-safety/interlock-design",
    title: 'Interlock Time Calculation',
  description: 'Calculates required interlock/shutter response time based on laser hazard level. IEC 60825-1 and ANSI Z136.1 require interlocks to terminate emission before exposure exceeds MPE.'
};

export default function Page() {
  return <PageClient />;
}

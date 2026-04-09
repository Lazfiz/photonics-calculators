import type { Metadata } from "next";
import PageClient from "./page-client";

export const metadata: Metadata = {
    alternates: { canonical: 'https://photonics-calculators.vercel.app/laser-safety/ultrafast-laser-safety' },
    title: 'Ultrafast Laser Safety Calculator',
  description: 'Evaluate single-pulse, average-power, and PRF-corrected MPE for femtosecond/picosecond laser systems.'
};

export default function Page() {
  return <PageClient />;
}

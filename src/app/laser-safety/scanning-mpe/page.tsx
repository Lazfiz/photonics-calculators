import type { Metadata } from "next";
import PageClient from "./page-client";

export const metadata: Metadata = {
    alternates: { canonical: 'https://photonics-calculators.vercel.app/laser-safety/scanning-mpe' },
    title: 'Scanned Beam MPE',
  description: 'Calculates the effective MPE for scanning laser beams where dwell time per retinal point is reduced compared to stationary exposure.'
};

export default function Page() {
  return <PageClient />;
}

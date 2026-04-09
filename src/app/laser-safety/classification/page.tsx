import type { Metadata } from "next";
import PageClient from "./page-client";

export const metadata: Metadata = {
    alternates: { canonical: 'https://photonics-calculators.vercel.app/laser-safety/classification' },
    title: 'Laser Classification — IEC 60825-1:2014',
  description: 'Laser product classification per IEC 60825-1 Edition 3.0 (2014). CW and pulsed AEL thresholds with C_A and C_B correction factors.'
};

export default function Page() {
  return <PageClient />;
}

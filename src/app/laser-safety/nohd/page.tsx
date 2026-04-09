import type { Metadata } from "next";
import PageClient from "./page-client";

export const metadata: Metadata = {
    alternates: { canonical: 'https://photonics-calculators.vercel.app/laser-safety/nohd' },
    title: 'Nominal Ocular Hazard Distance (NOHD)',
  description: 'Bounded CW point-source NOHD pre-check derived from the same direct-beam ocular MPE branch as the MPE page.'
};

export default function Page() {
  return <PageClient />;
}

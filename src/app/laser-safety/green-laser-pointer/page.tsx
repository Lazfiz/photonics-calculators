import type { Metadata } from "next";
import PageClient from "./page-client";

export const metadata: Metadata = {
    alternates: { canonical: 'https://photonics-calculators.vercel.app/laser-safety/green-laser-pointer' },
    title: 'Green Laser Pointer Safety',
  description: 'Safety analysis for 532 nm DPSS green laser pointers — NOHD, flashblindness, retinal hazard, and classification.'
};

export default function Page() {
  return <PageClient />;
}

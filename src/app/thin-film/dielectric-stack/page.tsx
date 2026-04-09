import type { Metadata } from "next";
import PageClient from "./page-client";

export const metadata: Metadata = {
    alternates: { canonical: 'https://photonics-calculators.vercel.app/thin-film/dielectric-stack' },
    title: 'Dielectric Stack Theory',
  description: 'Quarter-wave dielectric stack reflectance. Alternating high/low index layers create high-reflectance mirrors — the basis of dielectric mirrors and VCSELs.'
};

export default function Page() {
  return <PageClient />;
}

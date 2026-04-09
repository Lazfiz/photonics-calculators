import type { Metadata } from "next";
import PageClient from "./page-client";

export const metadata: Metadata = {
    alternates: { canonical: 'https://photonics-calculators.vercel.app/thin-film/stress' },
    title: 'Coating Stress & Curvature',
  description: 'Stoney',
};

export default function Page() {
  return <PageClient />;
}

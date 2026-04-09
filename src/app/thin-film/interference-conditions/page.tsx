import type { Metadata } from "next";
import PageClient from "./page-client";

export const metadata: Metadata = {
    alternates: { canonical: 'https://photonics-calculators.vercel.app/thin-film/interference-conditions' },
    title: 'Thin Film Interference Conditions',
  description: 'Constructive and destructive interference patterns from a single thin film, accounting for phase shifts at boundaries.'
};

export default function Page() {
  return <PageClient />;
}

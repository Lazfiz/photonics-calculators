import type { Metadata } from "next";
import PageClient from "./page-client";

export const metadata: Metadata = {
    alternates: { canonical: 'https://photonics-calculators.vercel.app/spectroscopy/fluorescence' },
    title: 'Fluorescence Lifetime',
  description: 'Exponential decay models for fluorescence. Single and bi-exponential fitting.'
};

export default function Page() {
  return <PageClient />;
}

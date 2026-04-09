import type { Metadata } from "next";
import PageClient from "./page-client";

export const metadata: Metadata = {
    alternates: { canonical: 'https://photonics-calculators.vercel.app/materials/transparency-range' },
    title: 'Transparency Range',
  description: 'UV cutoff to IR cutoff for common optical materials',
};

export default function Page() {
  return <PageClient />;
}

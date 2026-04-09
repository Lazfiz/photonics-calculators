import type { Metadata } from "next";
import PageClient from "./page-client";

export const metadata: Metadata = {
    alternates: { canonical: 'https://photonics-calculators.vercel.app/fiber-optics/multi-core' },
    title: 'Multi Core',
  description: 'Interactive Multi Core calculator for photonics and optical engineering.'
};

export default function Page() {
  return <PageClient />;
}

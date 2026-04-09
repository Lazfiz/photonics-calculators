import type { Metadata } from "next";
import PageClient from "./page-client";

export const metadata: Metadata = {
    alternates: { canonical: 'https://photonics-calculators.vercel.app/fiber-optics/link-budget' },
    title: 'Fiber Link Budget',
  description: 'Total optical link loss budget calculator. Power budget vs. accumulated losses.'
};

export default function Page() {
  return <PageClient />;
}

import type { Metadata } from "next";
import PageClient from "./page-client";

export const metadata: Metadata = {
    alternates: { canonical: 'https://photonics-calculators.vercel.app/free-space-comms/ber' },
    title: 'Ber',
  description: 'Interactive Ber calculator for photonics and optical engineering.'
};

export default function Page() {
  return <PageClient />;
}

import type { Metadata } from "next";
import PageClient from "./page-client";

export const metadata: Metadata = {
    alternates: { canonical: 'https://photonics-calculators.vercel.app/polarization/jones-calculus' },
    title: 'Jones Calculus',
  description: 'Chain Jones matrices for polarizers, waveplates, and rotators. Up to 5 elements.'
};

export default function Page() {
  return <PageClient />;
}

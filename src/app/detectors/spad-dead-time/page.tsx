import type { Metadata } from "next";
import PageClient from "./page-client";

export const metadata: Metadata = {
    canonical: "https://photonics-calculators.vercel.app/detectors/spad-dead-time",
    title: 'SPAD Dead Time',
  description: 'Dead time effects on measured count rates, pile-up loss, and correction for SPAD detectors.'
};

export default function Page() {
  return <PageClient />;
}

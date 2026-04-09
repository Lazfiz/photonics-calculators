import type { Metadata } from "next";
import PageClient from "./page-client";

export const metadata: Metadata = {
    canonical: "https://photonics-calculators.vercel.app/laser-safety/maximum-exposure",
    title: 'Maximum Exposure Duration',
  description: 'Interactive Maximum Exposure Duration calculator for photonics and optical engineering.'
};

export default function Page() {
  return <PageClient />;
}

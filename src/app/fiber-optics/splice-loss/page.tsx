import type { Metadata } from "next";
import PageClient from "./page-client";

export const metadata: Metadata = {
    canonical: "https://photonics-calculators.vercel.app/fiber-optics/splice-loss",
    title: 'Fiber Splice Loss',
  description: 'Estimate splice/connector loss from lateral offset, angular misalignment, and end-face gap for single-mode fiber.'
};

export default function Page() {
  return <PageClient />;
}

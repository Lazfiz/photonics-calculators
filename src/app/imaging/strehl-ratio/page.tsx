import type { Metadata } from "next";
import PageClient from "./page-client";

export const metadata: Metadata = {
    canonical: "https://photonics-calculators.vercel.app/imaging/strehl-ratio",
    title: 'Strehl Ratio Calculator',
  description: 'Estimate the Strehl ratio from wavefront error using the Maréchal approximation.'
};

export default function Page() {
  return <PageClient />;
}

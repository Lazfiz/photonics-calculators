import type { Metadata } from "next";
import PageClient from "./page-client";

export const metadata: Metadata = {
    canonical: "https://photonics-calculators.vercel.app/polarization/orthoconoscopic",
    title: 'Orthoscopic Observation',
  description: 'Model orthoscopic observation of birefringent samples with rotating stage. Calculate intensity vs rotation angle and interference colors.'
};

export default function Page() {
  return <PageClient />;
}

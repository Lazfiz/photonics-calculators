import type { Metadata } from "next";
import PageClient from "./page-client";

export const metadata: Metadata = {
    canonical: "https://photonics-calculators.vercel.app/materials/two-photon-absorption",
    title: 'Two-Photon Absorption',
  description: 'Nonlinear absorption coefficient PA and intensity-dependent transmission. TPA becomes significant at high peak intensities (pulsed lasers).',
};

export default function Page() {
  return <PageClient />;
}

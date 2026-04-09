import type { Metadata } from "next";
import PageClient from "./page-client";

export const metadata: Metadata = {
    alternates: { canonical: 'https://photonics-calculators.vercel.app/fiber-optics/nonlinear-effects' },
    title: 'Nonlinear Effects in Fiber',
  description: 'Calculate SPM, XPM, FWM penalties, SBS/SRS thresholds, and nonlinear phase shift.'
};

export default function Page() {
  return <PageClient />;
}

import type { Metadata } from "next";
import PageClient from "./page-client";

export const metadata: Metadata = {
    title: 'Nonlinear Effects in Fiber',
  description: 'Calculate SPM, XPM, FWM penalties, SBS/SRS thresholds, and nonlinear phase shift.'
};

export default function Page() {
  return <PageClient />;
}

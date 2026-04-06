import type { Metadata } from "next";
import PageClient from "./page-client";

export const metadata: Metadata = {
    title: 'OPA / OPO Design',
  description: 'Optical parametric oscillator and amplifier design — tuning curves, thresholds, and gain bandwidth.'
};

export default function Page() {
  return <PageClient />;
}

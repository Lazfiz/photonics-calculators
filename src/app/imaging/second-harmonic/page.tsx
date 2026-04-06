import type { Metadata } from "next";
import PageClient from "./page-client";

export const metadata: Metadata = {
    title: 'Second Harmonic Generation Calculator',
  description: 'SHG signal estimation, coherence length, and phase matching for nonlinear imaging.'
};

export default function Page() {
  return <PageClient />;
}

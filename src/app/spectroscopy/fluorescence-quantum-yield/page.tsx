import type { Metadata } from "next";
import PageClient from "./page-client";

export const metadata: Metadata = {
      title: 'Fluorescence Quantum Yield',
  description: 'Φ = Φ_ref (I_s/I_ref) (A_ref/A_s) (n_s/n_ref)² — comparative method using a reference standard.',
};

export default function Page() {
  return <PageClient />;
}

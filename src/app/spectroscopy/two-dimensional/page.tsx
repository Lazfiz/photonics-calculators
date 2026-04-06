import type { Metadata } from "next";
import PageClient from "./page-client";

export const metadata: Metadata = {
    title: 'Two-Dimensional (2D) Spectroscopy',
  description: 'Correlates excitation and detection frequencies via three-pulse photon echo. Reveals coupling, energy transfer, and homogeneous vs inhomogeneous broadening.'
};

export default function Page() {
  return <PageClient />;
}

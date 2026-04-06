import type { Metadata } from "next";
import PageClient from "./page-client";

export const metadata: Metadata = {
    title: 'Self-Phase Modulation (SPM)',
  description: 'Intensity-dependent phase shift and spectral broadening from the optical Kerr effect.'
};

export default function Page() {
  return <PageClient />;
}

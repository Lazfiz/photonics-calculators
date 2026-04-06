import type { Metadata } from "next";
import PageClient from "./page-client";

export const metadata: Metadata = {
    title: 'Parametric Amplification',
  description: 'Optical parametric amplification (OPA) gain and bandwidth in χ⁽²⁾ nonlinear crystals.'
};

export default function Page() {
  return <PageClient />;
}

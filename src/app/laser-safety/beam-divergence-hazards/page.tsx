import type { Metadata } from "next";
import PageClient from "./page-client";

export const metadata: Metadata = {
    title: 'Beam Divergence Hazards',
  description: 'Model Gaussian beam propagation and hazard distance based on beam divergence and MPE limits.'
};

export default function Page() {
  return <PageClient />;
}

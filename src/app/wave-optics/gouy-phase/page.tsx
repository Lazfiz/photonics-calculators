import type { Metadata } from "next";
import PageClient from "./page-client";

export const metadata: Metadata = {
    title: 'Gouy Phase Shift',
  description: 'Gouy phase ψ(z) = arctan(z/zᵣ) accumulated by Gaussian beam. Total phase shift through focus.'
};

export default function Page() {
  return <PageClient />;
}

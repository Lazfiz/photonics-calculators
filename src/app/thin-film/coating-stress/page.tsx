import type { Metadata } from "next";
import PageClient from "./page-client";

export const metadata: Metadata = {
      title: 'Coating Stress amp; Curvature',
  description: 'Stoney equation: κ = 6fdf / (Ests²).',
};

export default function Page() {
  return <PageClient />;
}

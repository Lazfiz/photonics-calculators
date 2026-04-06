import type { Metadata } from "next";
import PageClient from "./page-client";

export const metadata: Metadata = {
    title: 'Contamination Effects',
  description: 'Particle contamination impact on optical surfaces',
};

export default function Page() {
  return <PageClient />;
}
